import { and, asc, desc, eq, gte, inArray, isNull, lt, lte } from 'drizzle-orm';
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
import {
  type DbExecutor,
  deleteEmptyUnpaidInvoices,
  ensureInvoice,
  listInvoicesDueInMonth,
} from './invoicesRepository';
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

/**
 * Grava as Parcelas de uma Compra a partir dos seus campos atuais —
 * usado tanto na criação quanto em `rebuildInstallments` (edição de
 * valor/data/cartão/parcelas, issue #17), para as duas nunca divergirem.
 * Pix: sempre 1 parcela SEM fatura (`faturaId = null`) — conta direto no
 * saldo do mês pela `dataCompra` (data-model.md § Parcela; FR-015).
 * Cartão: FR-004..FR-006 — divide o valor entre as parcelas
 * (`splitInstallments`) e aloca cada uma na Fatura certa
 * (`allocateInstallmentsToInvoices` + `ensureInvoice`). Importação CSV
 * ancora a data na parcela da linha; o resto, na parcela 1 (issue #18).
 */
function writeInstallments(
  executor: DbExecutor,
  compra: Purchase,
  card: typeof cartoes.$inferSelect | null,
  responsabilidadeEfetiva: number,
  today: Date = new Date(),
): void {
  if (compra.formaPagamento === 'PIX' || !card) {
    executor
      .insert(parcelas)
      .values({
        id: randomUUID(),
        compraId: compra.id,
        faturaId: null,
        numero: 1,
        valor: compra.valorTotalOriginal,
        valorResponsabilidade: responsabilidadeEfetiva,
      })
      .run();
    return;
  }

  const plan = splitInstallments({
    valorTotalOriginal: compra.valorTotalOriginal,
    parcelasTotal: compra.parcelasTotal,
    parcelaAtual: compra.parcelaAtual,
    valorResponsabilidade: responsabilidadeEfetiva,
  });
  const anchorNumero = compra.origem === 'CSV_IMPORT' ? compra.parcelaAtual : 1;
  const allocations = allocateInstallmentsToInvoices(plan, card, compra.dataCompra, anchorNumero);

  for (const [index, installment] of plan.entries()) {
    const allocation = allocations[index];
    const invoice = ensureInvoice(executor, card, allocation.year, allocation.month, today);
    executor
      .insert(parcelas)
      .values({
        id: randomUUID(),
        compraId: compra.id,
        faturaId: invoice.id,
        numero: installment.numero,
        valor: installment.valor,
        valorResponsabilidade: installment.valorResponsabilidade,
      })
      .run();
  }
}

export type CreateCardPurchaseInput = {
  descricao: string;
  valorTotalOriginal: number;
  dataCompra: Date;
  cartaoId: string;
  categoriaId?: string;
  /** Total de parcelas (default 1 — compra à vista). */
  parcelasTotal?: number;
  /**
   * Só usado pela importação CSV (parcela da linha, "Parcela 4/10"). Fora
   * dela é sempre 1: `dataCompra` é a data da compra original e todas as
   * parcelas são criadas (issue #18).
   */
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
 * FR-004..FR-006: cria uma Compra no cartão e suas Parcelas
 * (`writeInstallments`) numa única transação.
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

  const origem = input.origem ?? 'MANUAL';
  // Issue #18: fora da importação CSV, a data é a da compra ORIGINAL e
  // todas as parcelas (1..N) são criadas — as já vencidas caem em
  // faturas que nascem PAGAS (`ensureInvoice`). Só o CSV cria a partir
  // da parcela da linha ("Parcela 4/10"), para não duplicar parcelas que
  // outras importações (meses anteriores) já trouxeram.
  const parcelaAtual = origem === 'CSV_IMPORT' ? parsed.parcelaAtual : 1;

  const estabelecimentoId =
    input.estabelecimentoId ??
    (await matchEstablishmentForDescription(parsed.descricao)) ??
    undefined;

  const compraId = randomUUID();
  const purchase = db.transaction((tx) => {
    const inserted = tx
      .insert(compras)
      .values({
        id: compraId,
        descricao: parsed.descricao,
        valorTotalOriginal: parsed.valorTotalOriginal,
        dataCompra: parsed.dataCompra,
        formaPagamento: 'CARTAO',
        cartaoId: card.id,
        parcelasTotal: parsed.parcelasTotal,
        parcelaAtual,
        comentario: input.comentario,
        categoriaId: input.categoriaId,
        estabelecimentoId,
        estabelecimentoManual: input.estabelecimentoId !== undefined,
        origem,
        loteImportacaoId: input.loteImportacaoId,
        assinaturaId: input.assinaturaId,
        valorResponsabilidade: input.valorResponsabilidade ?? null,
        motivo: input.motivo,
        responsavel: input.responsavel,
        criadoEm: new Date(),
      })
      .returning()
      .get();
    writeInstallments(tx, inserted, card, responsabilidadeEfetiva);
    return inserted;
  });

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
 * User Story 2: uma Compra Pix é sempre 1 parcela SEM fatura — ver
 * `writeInstallments`.
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
  const purchase = db.transaction((tx) => {
    const inserted = tx
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
      .returning()
      .get();
    writeInstallments(tx, inserted, null, responsabilidadeEfetiva);
    return inserted;
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
 * a coluna crua) é `FECHADA` ou `PAGA`. Desde a issue #17 não bloqueia
 * mais a edição — só dispara o aviso de confirmação na tela.
 */
export async function hasFrozenInstallments(
  compraId: string,
  today: Date = new Date(),
): Promise<boolean> {
  const rows = await db
    .select({ fatura: faturas, regra: cartoes.compraNoFechamentoVaiParaProxima })
    .from(parcelas)
    .innerJoin(faturas, eq(parcelas.faturaId, faturas.id))
    .innerJoin(cartoes, eq(faturas.cartaoId, cartoes.id))
    .where(eq(parcelas.compraId, compraId));

  return rows.some(({ fatura, regra }) => computeInvoiceStatus(fatura, today, regra) !== 'ABERTA');
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
  /** Issue #17 — qualquer um destes refaz as Parcelas (`rebuildInstallments`). */
  valorTotalOriginal?: number;
  dataCompra?: Date;
  formaPagamento?: 'PIX' | 'CARTAO';
  cartaoId?: string | null;
  parcelasTotal?: number;
};

const FINANCIAL_FIELDS = [
  'valorTotalOriginal',
  'dataCompra',
  'formaPagamento',
  'cartaoId',
  'parcelasTotal',
] as const;

/**
 * Descrição/categoria/comentário/estabelecimento só mudam a linha da
 * Compra. `valorResponsabilidade` é uma dimensão separada de "quem pagou
 * de fato", que pode mudar mesmo depois da fatura fechar/ser paga — só
 * propaga às Parcelas via `recomputeResponsibility`. Valor, data, forma
 * de pagamento, cartão e parcelas (issue #17) refazem TODAS as Parcelas
 * via `rebuildInstallments` — inclusive as de faturas já fechadas/pagas;
 * a tela avisa antes (`hasFrozenInstallments`). `estabelecimentoId`
 * definido por esta função é SEMPRE manual — nunca mais será
 * sobrescrito por `establishmentsRepository.addPattern` (FR-034).
 */
export async function updatePurchase(
  compraId: string,
  updates: UpdatePurchaseInput,
): Promise<void> {
  const compra = await getPurchase(compraId);
  if (!compra) return;

  const dbUpdates: UpdatePurchaseInput & { estabelecimentoManual?: boolean } = { ...updates };
  if ('estabelecimentoId' in updates) {
    dbUpdates.estabelecimentoManual = true;
  }

  const financialChanged = FINANCIAL_FIELDS.some((field) => {
    if (!(field in updates)) return false;
    const next = updates[field];
    const current = compra[field];
    return next instanceof Date && current instanceof Date
      ? next.getTime() !== current.getTime()
      : next !== current;
  });

  if (financialChanged) {
    const merged = { ...compra, ...dbUpdates };
    if (merged.formaPagamento === 'PIX') {
      dbUpdates.cartaoId = null;
      dbUpdates.parcelasTotal = 1;
    }
    purchaseSchema.parse({
      descricao: merged.descricao,
      valorTotalOriginal: merged.valorTotalOriginal,
      dataCompra: merged.dataCompra,
      formaPagamento: merged.formaPagamento,
      cartaoId: merged.formaPagamento === 'CARTAO' ? (merged.cartaoId ?? undefined) : undefined,
      parcelasTotal: merged.formaPagamento === 'PIX' ? 1 : merged.parcelasTotal,
      parcelaAtual: 1,
    });
  }

  const valorTotal = updates.valorTotalOriginal ?? compra.valorTotalOriginal;
  const valorResponsabilidade =
    'valorResponsabilidade' in updates
      ? updates.valorResponsabilidade
      : compra.valorResponsabilidade;
  if (valorResponsabilidade != null) {
    validateManualResponsibility(valorResponsabilidade, valorTotal);
  }

  await db.update(compras).set(dbUpdates).where(eq(compras.id, compraId));

  if (financialChanged || needsInstallmentNormalization(compra)) {
    await rebuildInstallments(compraId);
  } else if ('valorResponsabilidade' in updates) {
    await recomputeResponsibility(compraId);
  }
}

/**
 * Compra manual criada antes da issue #18 com "parcela atual" > 1: só
 * tinha as parcelas restantes, alocadas a partir do mês da data. Ao
 * salvá-la de novo, as Parcelas são refeitas com a regra nova (todas,
 * data = compra original).
 */
function needsInstallmentNormalization(compra: Purchase): boolean {
  return compra.origem !== 'CSV_IMPORT' && compra.parcelaAtual > 1;
}

/**
 * Issue #17: apaga e recria TODAS as Parcelas da Compra a partir dos
 * seus campos atuais (`writeInstallments`), numa transação só. Faturas
 * que ficarem vazias (do cartão antigo e do novo) são removidas se não
 * estiverem pagas (`deleteEmptyUnpaidInvoices`).
 */
export async function rebuildInstallments(
  compraId: string,
  today: Date = new Date(),
): Promise<void> {
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

  db.transaction((tx) => {
    const normalized = needsInstallmentNormalization(compra)
      ? { ...compra, parcelaAtual: 1 }
      : compra;
    if (normalized !== compra) {
      tx.update(compras).set({ parcelaAtual: 1 }).where(eq(compras.id, compraId)).run();
    }

    const affectedCardIds = new Set(
      tx
        .select({ cartaoId: faturas.cartaoId })
        .from(parcelas)
        .innerJoin(faturas, eq(parcelas.faturaId, faturas.id))
        .where(eq(parcelas.compraId, compraId))
        .all()
        .map((row) => row.cartaoId),
    );

    const card =
      normalized.formaPagamento === 'CARTAO' && normalized.cartaoId
        ? tx.select().from(cartoes).where(eq(cartoes.id, normalized.cartaoId)).get()
        : undefined;
    if (normalized.formaPagamento === 'CARTAO' && !card) {
      throw new Error(`Cartão ${normalized.cartaoId} não encontrado`);
    }
    if (card) affectedCardIds.add(card.id);

    tx.delete(parcelas).where(eq(parcelas.compraId, compraId)).run();
    writeInstallments(tx, normalized, card ?? null, responsabilidadeEfetiva, today);

    for (const cardId of affectedCardIds) {
      deleteEmptyUnpaidInvoices(tx, cardId);
    }
  });
}

/**
 * Issue #17: exclusão definitiva (sem soft delete) de uma Compra errada.
 * Entradas avulsas vinculadas continuam existindo, só perdem o vínculo;
 * faturas não pagas que ficarem vazias são removidas.
 */
export async function deletePurchase(compraId: string): Promise<void> {
  db.transaction((tx) => {
    const affectedCardIds = new Set(
      tx
        .select({ cartaoId: faturas.cartaoId })
        .from(parcelas)
        .innerJoin(faturas, eq(parcelas.faturaId, faturas.id))
        .where(eq(parcelas.compraId, compraId))
        .all()
        .map((row) => row.cartaoId),
    );

    tx.update(entradasAvulsas)
      .set({ compraVinculadaId: null })
      .where(eq(entradasAvulsas.compraVinculadaId, compraId))
      .run();
    tx.delete(compraTags).where(eq(compraTags.compraId, compraId)).run();
    tx.delete(parcelas).where(eq(parcelas.compraId, compraId)).run();
    tx.delete(compras).where(eq(compras.id, compraId)).run();

    for (const cardId of affectedCardIds) {
      deleteEmptyUnpaidInvoices(tx, cardId);
    }
  });
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
    parcela:
      compra.parcelasTotal > 1 ? { atual: parcela.numero, total: compra.parcelasTotal } : null,
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
export async function listPurchasesForMonth(
  year: number,
  month: number,
): Promise<PurchaseListRow[]> {
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

/** `MonthRange.earliest` (`contracts/purchases-overview.md`): data da Compra mais antiga cadastrada. */
export async function getEarliestCompraDate(): Promise<Date | null> {
  const [row] = await db
    .select({ dataCompra: compras.dataCompra })
    .from(compras)
    .orderBy(asc(compras.dataCompra))
    .limit(1);
  return row?.dataCompra ?? null;
}

export type ForecastInvoiceGroup = {
  cartaoNome: string;
  dataVencimento: Date;
  rows: PurchaseListRow[];
};

/**
 * Tela Compras, mês futuro previsto (FR-013): reaproveita
 * `listInvoicesDueInMonth` + `listPurchasesForInvoice` (já existentes)
 * para agrupar as parcelas já lançadas para o mês por fatura, em vez
 * de por dia (contracts/purchases-overview.md).
 */
export async function listForecastInvoicesForMonth(
  year: number,
  month: number,
): Promise<ForecastInvoiceGroup[]> {
  const invoices = await listInvoicesDueInMonth(year, month);

  return Promise.all(
    invoices.map(async (invoice) => {
      const [card] = await db
        .select({ nome: cartoes.nome })
        .from(cartoes)
        .where(eq(cartoes.id, invoice.cartaoId));
      const cartaoNome = card?.nome ?? 'Cartão';
      const purchaseRows = await listPurchasesForInvoice(invoice.id);

      const rows = purchaseRows.map((row) =>
        toPurchaseListRow(
          {
            id: row.parcelaId,
            compraId: row.compra.id,
            faturaId: invoice.id,
            numero: row.numero,
            valor: row.valor,
            valorResponsabilidade: row.valorResponsabilidade,
          },
          row.compra,
          row.categoria,
          cartaoNome,
          invoice.dataVencimento,
        ),
      );

      return { cartaoNome, dataVencimento: invoice.dataVencimento, rows };
    }),
  );
}
