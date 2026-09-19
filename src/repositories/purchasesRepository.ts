import { and, desc, eq, gte, inArray, isNull, lt, lte } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';

import { db } from '@/db/client';
import {
  cartoes,
  categorias,
  compraTags,
  compras,
  entradasAvulsas,
  estabelecimentos,
  faturas,
  parcelas,
  tags,
} from '@/db/schema';
import { resolveResponsibility } from '@/domain/expenseSplitting/resolveResponsibility';
import { validateManualResponsibility } from '@/domain/expenseSplitting/validateManualResponsibility';
import { allocateInstallmentsToInvoices } from '@/domain/installments/allocateInstallmentsToInvoices';
import { splitInstallments } from '@/domain/installments/splitInstallments';
import { computeInvoiceStatus } from '@/domain/invoices/computeInvoiceStatus';
import type { PurchaseListRow } from '@/domain/purchasesOverview/types';
import { purchaseSchema } from '@/domain/shared/purchaseSchema';
import { resolvePeriod } from '@/domain/statistics/resolvePeriod';

import { matchEstablishmentForDescription } from './establishmentsRepository';
import { getOrCreateInvoice } from './invoicesRepository';
import { findOrCreateTag } from './tagsRepository';

export type Purchase = typeof compras.$inferSelect;

/**
 * FR-007/FR-008: resolve (criando se preciso, via `tagsRepository`)
 * cada nome de tag e grava o vínculo `CompraTag` uma única vez por
 * Compra — todas as Parcelas herdam via `compraId`, nunca por parcela.
 */
async function attachTagsToCompra(compraId: string, tagNomes: string[] | undefined): Promise<void> {
  if (!tagNomes || tagNomes.length === 0) return;
  const tags = await Promise.all(tagNomes.map((nome) => findOrCreateTag(nome)));
  await db.insert(compraTags).values(tags.map((tag) => ({ compraId, tagId: tag.id })));
}

export type CreateCardPurchaseInput = {
  descricao: string;
  valorTotalOriginal: number;
  dataCompra: Date;
  cartaoId: string;
  categoriaId?: string;
  /** Total de parcelas (default 1 — compra à vista). */
  parcelasTotal?: number;
  /** Próxima parcela a vencer (default 1); >1 = parcelamento já em andamento (FR-004). */
  parcelaAtual?: number;
  comentario?: string;
  tagNomes?: string[];
  /**
   * Default `'MANUAL'` — `csvImportRepository` passa `'CSV_IMPORT'` +
   * `loteImportacaoId` (FR-009); `subscriptionsRepository` passa
   * `'ASSINATURA'` + `assinaturaId` (FR-017).
   */
  origem?: 'MANUAL' | 'CSV_IMPORT' | 'ASSINATURA';
  loteImportacaoId?: string;
  assinaturaId?: string;
  /** US12/FR-046..FR-048 — validado por `validateManualResponsibility` antes de salvar. */
  valorResponsabilidade?: number;
  motivo?: string;
  responsavel?: string;
  /** US10/FR-034 — se ausente, tenta matching automático por `matchEstablishmentForDescription`. */
  estabelecimentoId?: string;
};

/**
 * FR-004..FR-006: cria uma Compra no cartão, dividindo automaticamente
 * o valor entre as parcelas restantes (`splitInstallments`) e
 * alocando cada uma na Fatura correta (`allocateInstallmentsToInvoices`
 * + `getOrCreateInvoice`, que garante a Fatura existir antes de
 * inserir a Parcela).
 */
export async function createCardPurchase(input: CreateCardPurchaseInput): Promise<Purchase> {
  const parsed = purchaseSchema.parse({
    descricao: input.descricao,
    valorTotalOriginal: input.valorTotalOriginal,
    dataCompra: input.dataCompra,
    formaPagamento: 'CARTAO',
    cartaoId: input.cartaoId,
    parcelasTotal: input.parcelasTotal ?? 1,
    parcelaAtual: input.parcelaAtual ?? 1,
  });

  const [card] = await db.select().from(cartoes).where(eq(cartoes.id, parsed.cartaoId!));
  if (!card) {
    throw new Error(`Cartão ${input.cartaoId} não encontrado`);
  }

  if (input.valorResponsabilidade !== undefined) {
    validateManualResponsibility(input.valorResponsabilidade, parsed.valorTotalOriginal);
  }
  const responsabilidadeEfetiva = resolveResponsibility(
    {
      valorTotalOriginal: parsed.valorTotalOriginal,
      valorResponsabilidade: input.valorResponsabilidade ?? null,
    },
    [],
  );

  const plan = splitInstallments({
    valorTotalOriginal: parsed.valorTotalOriginal,
    parcelasTotal: parsed.parcelasTotal,
    parcelaAtual: parsed.parcelaAtual,
    valorResponsabilidade: responsabilidadeEfetiva,
  });
  const allocations = allocateInstallmentsToInvoices(plan, card, parsed.dataCompra);

  const estabelecimentoId =
    input.estabelecimentoId ??
    (await matchEstablishmentForDescription(parsed.descricao)) ??
    undefined;

  const compraId = randomUUID();
  const [purchase] = await db
    .insert(compras)
    .values({
      id: compraId,
      descricao: parsed.descricao,
      valorTotalOriginal: parsed.valorTotalOriginal,
      dataCompra: parsed.dataCompra,
      formaPagamento: 'CARTAO',
      cartaoId: card.id,
      parcelasTotal: parsed.parcelasTotal,
      parcelaAtual: parsed.parcelaAtual,
      comentario: input.comentario,
      categoriaId: input.categoriaId,
      estabelecimentoId,
      estabelecimentoManual: input.estabelecimentoId !== undefined,
      origem: input.origem ?? 'MANUAL',
      loteImportacaoId: input.loteImportacaoId,
      assinaturaId: input.assinaturaId,
      valorResponsabilidade: input.valorResponsabilidade ?? null,
      motivo: input.motivo,
      responsavel: input.responsavel,
      criadoEm: new Date(),
    })
    .returning();

  for (const [index, installment] of plan.entries()) {
    const allocation = allocations[index];
    const invoice = await getOrCreateInvoice(card.id, allocation.year, allocation.month);
    await db.insert(parcelas).values({
      id: randomUUID(),
      compraId,
      faturaId: invoice.id,
      numero: installment.numero,
      valor: installment.valor,
      valorResponsabilidade: installment.valorResponsabilidade,
    });
  }

  await attachTagsToCompra(compraId, input.tagNomes);

  return purchase;
}

export type CreatePixPurchaseInput = {
  descricao: string;
  valorTotalOriginal: number;
  dataCompra: Date;
  categoriaId?: string;
  comentario?: string;
  tagNomes?: string[];
  /** Default `'MANUAL'` — `subscriptionsRepository` passa `'ASSINATURA'` + `assinaturaId` (FR-017). */
  origem?: 'MANUAL' | 'ASSINATURA';
  assinaturaId?: string;
  /** US12/FR-046..FR-048 — validado por `validateManualResponsibility` antes de salvar. */
  valorResponsabilidade?: number;
  motivo?: string;
  responsavel?: string;
  /** US10/FR-034 — se ausente, tenta matching automático por `matchEstablishmentForDescription`. */
  estabelecimentoId?: string;
};

/**
 * User Story 2: uma Compra Pix é sempre 1 parcela SEM fatura
 * (`faturaId = null`) — conta direto no saldo do mês pela `dataCompra`,
 * nunca no total de uma fatura de cartão (nota de `data-model.md` §
 * Parcela; FR-015).
 */
export async function createPixPurchase(input: CreatePixPurchaseInput): Promise<Purchase> {
  const parsed = purchaseSchema.parse({
    descricao: input.descricao,
    valorTotalOriginal: input.valorTotalOriginal,
    dataCompra: input.dataCompra,
    formaPagamento: 'PIX',
    parcelasTotal: 1,
    parcelaAtual: 1,
  });

  if (input.valorResponsabilidade !== undefined) {
    validateManualResponsibility(input.valorResponsabilidade, parsed.valorTotalOriginal);
  }
  const responsabilidadeEfetiva = resolveResponsibility(
    {
      valorTotalOriginal: parsed.valorTotalOriginal,
      valorResponsabilidade: input.valorResponsabilidade ?? null,
    },
    [],
  );

  const estabelecimentoId =
    input.estabelecimentoId ??
    (await matchEstablishmentForDescription(parsed.descricao)) ??
    undefined;

  const compraId = randomUUID();
  const [purchase] = await db
    .insert(compras)
    .values({
      id: compraId,
      descricao: parsed.descricao,
      valorTotalOriginal: parsed.valorTotalOriginal,
      dataCompra: parsed.dataCompra,
      formaPagamento: 'PIX',
      cartaoId: null,
      parcelasTotal: 1,
      parcelaAtual: 1,
      comentario: input.comentario,
      categoriaId: input.categoriaId,
      estabelecimentoId,
      estabelecimentoManual: input.estabelecimentoId !== undefined,
      origem: input.origem ?? 'MANUAL',
      assinaturaId: input.assinaturaId,
      valorResponsabilidade: input.valorResponsabilidade ?? null,
      motivo: input.motivo,
      responsavel: input.responsavel,
      criadoEm: new Date(),
    })
    .returning();

  await db.insert(parcelas).values({
    id: randomUUID(),
    compraId,
    faturaId: null,
    numero: 1,
    valor: parsed.valorTotalOriginal,
    valorResponsabilidade: responsabilidadeEfetiva,
  });

  await attachTagsToCompra(compraId, input.tagNomes);

  return purchase;
}

/** Compras Pix de um mês de referência — base do saldo do mês (FR-015). */
export async function listPixPurchasesForMonth(year: number, month: number): Promise<Purchase[]> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);
  return db
    .select()
    .from(compras)
    .where(
      and(
        eq(compras.formaPagamento, 'PIX'),
        gte(compras.dataCompra, monthStart),
        lt(compras.dataCompra, monthEnd),
      ),
    );
}

export async function getPurchase(compraId: string): Promise<Purchase | undefined> {
  const [purchase] = await db.select().from(compras).where(eq(compras.id, compraId));
  return purchase;
}

export type InvoicePurchaseRow = {
  parcelaId: string;
  numero: number;
  valor: number;
  valorResponsabilidade: number;
  compra: Purchase;
  /** Para `TransactionAvatar` (FR-030) — `null` até a Compra ter uma categoria. */
  categoria: { icone: string; nome: string } | null;
  /** Idem — sempre `null` até a User Story 10 existir. */
  estabelecimento: { logoCachePath: string | null; iconeRespaldo: string } | null;
  /** Etiquetas da Compra (FR-007/FR-008) — exibidas como chips em Fatura · Detalhe. */
  tags: string[];
};

/**
 * Compras (via sua Parcela) alocadas em uma Fatura específica — usado
 * pela tela Fatura · Detalhe. `valor`/`valorResponsabilidade` vêm da
 * Parcela (o que de fato recai nesta fatura), o resto vem da Compra.
 * `categoria`/`estabelecimento` vêm via left join só para alimentar
 * `TransactionAvatar` sem uma segunda consulta por linha. `tags` vem de
 * uma segunda consulta em lote (não dá para agregar array em SQLite via
 * drizzle aqui) para não fazer N+1 por linha.
 */
export async function listPurchasesForInvoice(invoiceId: string): Promise<InvoicePurchaseRow[]> {
  const rows = await db
    .select({
      parcela: parcelas,
      compra: compras,
      categoria: { icone: categorias.icone, nome: categorias.nome },
      estabelecimento: {
        logoCachePath: estabelecimentos.logoCachePath,
        iconeRespaldo: estabelecimentos.iconeRespaldo,
      },
    })
    .from(parcelas)
    .innerJoin(compras, eq(parcelas.compraId, compras.id))
    .leftJoin(categorias, eq(compras.categoriaId, categorias.id))
    .leftJoin(estabelecimentos, eq(compras.estabelecimentoId, estabelecimentos.id))
    .where(eq(parcelas.faturaId, invoiceId));

  const compraIds = rows.map((row) => row.compra.id);
  const tagRows = compraIds.length
    ? await db
        .select({ compraId: compraTags.compraId, nome: tags.nome })
        .from(compraTags)
        .innerJoin(tags, eq(compraTags.tagId, tags.id))
        .where(inArray(compraTags.compraId, compraIds))
    : [];
  const tagsByCompraId = new Map<string, string[]>();
  for (const tagRow of tagRows) {
    const current = tagsByCompraId.get(tagRow.compraId) ?? [];
    current.push(tagRow.nome);
    tagsByCompraId.set(tagRow.compraId, current);
  }

  return rows.map(({ parcela, compra, categoria, estabelecimento }) => ({
    parcelaId: parcela.id,
    numero: parcela.numero,
    valor: parcela.valor,
    valorResponsabilidade: parcela.valorResponsabilidade,
    compra,
    categoria: categoria?.icone ? { icone: categoria.icone, nome: categoria.nome ?? '' } : null,
    estabelecimento: estabelecimento?.iconeRespaldo
      ? {
          logoCachePath: estabelecimento.logoCachePath,
          iconeRespaldo: estabelecimento.iconeRespaldo,
        }
      : null,
    tags: tagsByCompraId.get(compra.id) ?? [],
  }));
}

/**
 * Edge Case: "parcela já lançada em fatura fechada/paga fica
 * congelada" — verdadeiro se QUALQUER Parcela desta Compra pertence a
 * uma Fatura cujo status de exibição (via `computeInvoiceStatus`, não
 * a coluna crua) é `FECHADA` ou `PAGA`.
 */
export async function hasFrozenInstallments(
  compraId: string,
  today: Date = new Date(),
): Promise<boolean> {
  const rows = await db
    .select({ fatura: faturas })
    .from(parcelas)
    .innerJoin(faturas, eq(parcelas.faturaId, faturas.id))
    .where(eq(parcelas.compraId, compraId));

  return rows.some(({ fatura }) => computeInvoiceStatus(fatura, today) !== 'ABERTA');
}

export type UpdatePurchaseInput = {
  descricao?: string;
  categoriaId?: string | null;
  comentario?: string | null;
  /** US12/FR-046..FR-048 — `null` limpa o valor manual (volta ao total, se não houver entrada vinculada). */
  valorResponsabilidade?: number | null;
  motivo?: string | null;
  responsavel?: string | null;
  /** US10/FR-034 — associar/remover manualmente; sempre marca `estabelecimentoManual = true`. */
  estabelecimentoId?: string | null;
};

/**
 * Descrição/categoria/comentário nunca afetam `Parcela.valor`, então
 * não precisam checar parcelas congeladas. `valorResponsabilidade`
 * também não — é uma dimensão separada de "quem pagou de fato", que
 * pode mudar mesmo depois da fatura fechar/ser paga (ex.: reembolso
 * recebido depois) — só dispara `recomputeResponsibility` para
 * propagar a mudança às Parcelas já existentes. `estabelecimentoId`
 * definido por esta função é SEMPRE manual (distinto do matching
 * automático em `createCardPurchase`/`createPixPurchase`) — nunca mais
 * será sobrescrito por `establishmentsRepository.addPattern` (FR-034).
 * Uma futura tela de "editar valor/parcelamento" em si (nenhuma existe
 * ainda) deve chamar `hasFrozenInstallments` antes de permitir ESSA
 * edição.
 */
export async function updatePurchase(
  compraId: string,
  updates: UpdatePurchaseInput,
): Promise<void> {
  if (updates.valorResponsabilidade != null) {
    const compra = await getPurchase(compraId);
    if (compra) {
      validateManualResponsibility(updates.valorResponsabilidade, compra.valorTotalOriginal);
    }
  }

  const dbUpdates: typeof updates & { estabelecimentoManual?: boolean } = { ...updates };
  if ('estabelecimentoId' in updates) {
    dbUpdates.estabelecimentoManual = true;
  }

  await db.update(compras).set(dbUpdates).where(eq(compras.id, compraId));

  if ('valorResponsabilidade' in updates) {
    await recomputeResponsibility(compraId);
  }
}

async function listEntradasVinculadas(compraId: string): Promise<{ valor: number }[]> {
  return db
    .select({ valor: entradasAvulsas.valor })
    .from(entradasAvulsas)
    .where(eq(entradasAvulsas.compraVinculadaId, compraId));
}

/**
 * FR-051: reexecuta a precedência de responsabilidade (`resolveResponsibility`)
 * e propaga o resultado, se mudou, para `Parcela.valorResponsabilidade`
 * de TODAS as parcelas já existentes da Compra — via `splitInstallments`
 * (mesma proporção, FR-055), nunca reatribuindo fatura nem `Parcela.valor`.
 * Chamado sempre que o valor manual muda ou uma EntradaAvulsa vinculada
 * é criada/editada/excluída/desvinculada.
 */
export async function recomputeResponsibility(compraId: string): Promise<void> {
  const compra = await getPurchase(compraId);
  if (!compra) return;

  const entradasVinculadas = await listEntradasVinculadas(compraId);
  const responsabilidadeEfetiva = resolveResponsibility(
    {
      valorTotalOriginal: compra.valorTotalOriginal,
      valorResponsabilidade: compra.valorResponsabilidade,
    },
    entradasVinculadas,
  );

  const plan = splitInstallments({
    valorTotalOriginal: compra.valorTotalOriginal,
    parcelasTotal: compra.parcelasTotal,
    parcelaAtual: compra.parcelaAtual,
    valorResponsabilidade: responsabilidadeEfetiva,
  });

  const existingParcelas = await db.select().from(parcelas).where(eq(parcelas.compraId, compraId));

  for (const entry of plan) {
    const match = existingParcelas.find((parcela) => parcela.numero === entry.numero);
    if (match) {
      await db
        .update(parcelas)
        .set({ valorResponsabilidade: entry.valorResponsabilidade })
        .where(eq(parcelas.id, match.id));
    }
  }
}

/** Nomes das tags atuais de uma Compra — para pré-preencher a tela de edição (FR-007). */
export async function listTagsForCompra(compraId: string): Promise<string[]> {
  const rows = await db
    .select({ nome: tags.nome })
    .from(compraTags)
    .innerJoin(tags, eq(compraTags.tagId, tags.id))
    .where(eq(compraTags.compraId, compraId));
  return rows.map((row) => row.nome);
}

/**
 * FR-007: substitui TODAS as tags da Compra pela lista dada — nunca
 * mescla (evita "tag fantasma" que o usuário já removeu no formulário
 * continuar vinculada). Usado também para adicionar tags/comentário a
 * uma transação importada via CSV (T079).
 */
export async function setPurchaseTags(compraId: string, tagNomes: string[]): Promise<void> {
  await db.delete(compraTags).where(eq(compraTags.compraId, compraId));
  await attachTagsToCompra(compraId, tagNomes);
}

export type RecentPurchaseRow = {
  compra: Purchase;
  categoria: { icone: string; nome: string } | null;
  estabelecimento: {
    logoCachePath: string | null;
    iconeRespaldo: string;
    nomeExibicao: string;
  } | null;
};

/** Início · Main (Main.dc.html § "Transações recentes"): últimas Compras, mais recente primeiro. */
export async function listRecentPurchases(limit: number): Promise<RecentPurchaseRow[]> {
  const rows = await db
    .select({
      compra: compras,
      categoria: { icone: categorias.icone, nome: categorias.nome },
      estabelecimento: {
        logoCachePath: estabelecimentos.logoCachePath,
        iconeRespaldo: estabelecimentos.iconeRespaldo,
        nomeExibicao: estabelecimentos.nomeExibicao,
      },
    })
    .from(compras)
    .leftJoin(categorias, eq(compras.categoriaId, categorias.id))
    .leftJoin(estabelecimentos, eq(compras.estabelecimentoId, estabelecimentos.id))
    .orderBy(desc(compras.dataCompra))
    .limit(limit);

  return rows.map(({ compra, categoria, estabelecimento }) => ({
    compra,
    categoria: categoria?.icone ? { icone: categoria.icone, nome: categoria.nome ?? '' } : null,
    estabelecimento: estabelecimento?.iconeRespaldo
      ? {
          logoCachePath: estabelecimento.logoCachePath,
          iconeRespaldo: estabelecimento.iconeRespaldo,
          nomeExibicao: estabelecimento.nomeExibicao ?? '',
        }
      : null,
  }));
}

function toPurchaseListRow(
  parcela: typeof parcelas.$inferSelect,
  compra: typeof compras.$inferSelect,
  categoria: { icone: string | null; nome: string | null } | null,
  nomeCartao: string | null,
  dataCompra: Date,
): PurchaseListRow {
  return {
    parcelaId: parcela.id,
    compraId: compra.id,
    descricao: compra.descricao,
    categoria: categoria?.icone ? { icone: categoria.icone, nome: categoria.nome ?? '' } : null,
    valor: parcela.valor,
    formaPagamento: compra.formaPagamento,
    nomeCartao,
    parcela: compra.parcelasTotal > 1 ? { atual: parcela.numero, total: compra.parcelasTotal } : null,
    dataCompra,
  };
}

/**
 * Tela Compras (002-central-de-compras), mês atual/passado: todas as
 * Parcelas (cartão + Pix) do mês, no mesmo critério de atribuição de
 * mês já usado por `domain/statistics` (`listParcelasForPeriod`) — Pix
 * pela `dataCompra`, cartão pela `dataVencimento` da sua Fatura — para
 * o total nunca divergir do "Gastos" já exibido na Início. Mais
 * recente primeiro (contracts/purchases-overview.md).
 */
export async function listPurchasesForMonth(year: number, month: number): Promise<PurchaseListRow[]> {
  const period = resolvePeriod('MENSAL', new Date(year, month - 1, 15)).current;

  const pixRows = await db
    .select({
      parcela: parcelas,
      compra: compras,
      categoria: { icone: categorias.icone, nome: categorias.nome },
    })
    .from(parcelas)
    .innerJoin(compras, eq(parcelas.compraId, compras.id))
    .leftJoin(categorias, eq(compras.categoriaId, categorias.id))
    .where(
      and(
        isNull(parcelas.faturaId),
        gte(compras.dataCompra, period.start),
        lte(compras.dataCompra, period.end),
      ),
    );

  const cardRows = await db
    .select({
      parcela: parcelas,
      compra: compras,
      categoria: { icone: categorias.icone, nome: categorias.nome },
      cartaoNome: cartoes.nome,
      dataVencimento: faturas.dataVencimento,
    })
    .from(parcelas)
    .innerJoin(compras, eq(parcelas.compraId, compras.id))
    .innerJoin(faturas, eq(parcelas.faturaId, faturas.id))
    .innerJoin(cartoes, eq(faturas.cartaoId, cartoes.id))
    .leftJoin(categorias, eq(compras.categoriaId, categorias.id))
    .where(and(gte(faturas.dataVencimento, period.start), lte(faturas.dataVencimento, period.end)));

  const rows = [
    ...pixRows.map((row) =>
      toPurchaseListRow(row.parcela, row.compra, row.categoria, null, row.compra.dataCompra),
    ),
    ...cardRows.map((row) =>
      toPurchaseListRow(row.parcela, row.compra, row.categoria, row.cartaoNome, row.dataVencimento),
    ),
  ];

  return rows.sort((a, b) => b.dataCompra.getTime() - a.dataCompra.getTime());
}
