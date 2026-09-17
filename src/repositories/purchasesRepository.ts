import { and, eq, gte, lt } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';

import { db } from '@/db/client';
import { cartoes, compraTags, compras, faturas, parcelas } from '@/db/schema';
import { allocateInstallmentsToInvoices } from '@/domain/installments/allocateInstallmentsToInvoices';
import { splitInstallments } from '@/domain/installments/splitInstallments';
import { computeInvoiceStatus } from '@/domain/invoices/computeInvoiceStatus';
import { purchaseSchema } from '@/domain/shared/purchaseSchema';

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

  const plan = splitInstallments({
    valorTotalOriginal: parsed.valorTotalOriginal,
    parcelasTotal: parsed.parcelasTotal,
    parcelaAtual: parsed.parcelaAtual,
    valorResponsabilidade: null,
  });
  const allocations = allocateInstallmentsToInvoices(plan, card, parsed.dataCompra);

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
      estabelecimentoManual: false,
      origem: 'MANUAL',
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
      estabelecimentoManual: false,
      origem: 'MANUAL',
      criadoEm: new Date(),
    })
    .returning();

  await db.insert(parcelas).values({
    id: randomUUID(),
    compraId,
    faturaId: null,
    numero: 1,
    valor: parsed.valorTotalOriginal,
    valorResponsabilidade: parsed.valorTotalOriginal,
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

export type InvoicePurchaseRow = {
  parcelaId: string;
  numero: number;
  valor: number;
  valorResponsabilidade: number;
  compra: Purchase;
};

/**
 * Compras (via sua Parcela) alocadas em uma Fatura específica — usado
 * pela tela Fatura · Detalhe. `valor`/`valorResponsabilidade` vêm da
 * Parcela (o que de fato recai nesta fatura), o resto vem da Compra.
 */
export async function listPurchasesForInvoice(invoiceId: string): Promise<InvoicePurchaseRow[]> {
  const rows = await db
    .select({ parcela: parcelas, compra: compras })
    .from(parcelas)
    .innerJoin(compras, eq(parcelas.compraId, compras.id))
    .where(eq(parcelas.faturaId, invoiceId));

  return rows.map(({ parcela, compra }) => ({
    parcelaId: parcela.id,
    numero: parcela.numero,
    valor: parcela.valor,
    valorResponsabilidade: parcela.valorResponsabilidade,
    compra,
  }));
}

/**
 * Edge Case: "parcela já lançada em fatura fechada/paga fica
 * congelada" — verdadeiro se QUALQUER Parcela desta Compra pertence a
 * uma Fatura cujo status de exibição (via `computeInvoiceStatus`, não
 * a coluna crua) é `FECHADA` ou `PAGA`.
 */
export async function hasFrozenInstallments(compraId: string, today: Date = new Date()): Promise<boolean> {
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
};

/**
 * Só atualiza campos que nunca afetam `Parcela.valor` (descrição,
 * categoria, comentário) — por isso não precisa checar parcelas
 * congeladas para eles. Uma futura tela de "editar valor/parcelamento"
 * (nenhuma existe ainda) deve chamar `hasFrozenInstallments` antes de
 * permitir essa edição mais sensível e bloquear se retornar `true`.
 */
export async function updatePurchase(compraId: string, updates: UpdatePurchaseInput): Promise<void> {
  await db.update(compras).set(updates).where(eq(compras.id, compraId));
}
