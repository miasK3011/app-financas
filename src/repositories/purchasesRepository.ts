import { eq } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';

import { db } from '@/db/client';
import { cartoes, compras, parcelas } from '@/db/schema';
import { resolveInvoicePeriod } from '@/domain/invoices/resolveInvoicePeriod';
import { purchaseSchema } from '@/domain/shared/purchaseSchema';

import { getOrCreateInvoice } from './invoicesRepository';

export type Purchase = typeof compras.$inferSelect;

export type CreateCardPurchaseInput = {
  descricao: string;
  valorTotalOriginal: number;
  dataCompra: Date;
  cartaoId: string;
  categoriaId?: string;
};

/**
 * Versão mínima (User Story 1): cria uma Compra à vista no cartão — 1
 * parcela, sem suporte a parcelamento ainda (estendido em `createCardPurchase`
 * pela User Story 4, T054, que reescreve a alocação de parcelas). A
 * fatura correta é resolvida via `resolveInvoicePeriod` +
 * `getOrCreateInvoice` (FR-002).
 */
export async function createCardPurchase(input: CreateCardPurchaseInput): Promise<Purchase> {
  const parsed = purchaseSchema.parse({
    descricao: input.descricao,
    valorTotalOriginal: input.valorTotalOriginal,
    dataCompra: input.dataCompra,
    formaPagamento: 'CARTAO',
    cartaoId: input.cartaoId,
    parcelasTotal: 1,
    parcelaAtual: 1,
  });

  const [card] = await db.select().from(cartoes).where(eq(cartoes.id, parsed.cartaoId!));
  if (!card) {
    throw new Error(`Cartão ${input.cartaoId} não encontrado`);
  }

  const { year, month } = resolveInvoicePeriod(card.diaFechamento, parsed.dataCompra);
  const invoice = await getOrCreateInvoice(card.id, year, month);

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
      parcelasTotal: 1,
      parcelaAtual: 1,
      categoriaId: input.categoriaId,
      estabelecimentoManual: false,
      origem: 'MANUAL',
      criadoEm: new Date(),
    })
    .returning();

  await db.insert(parcelas).values({
    id: randomUUID(),
    compraId,
    faturaId: invoice.id,
    numero: 1,
    valor: parsed.valorTotalOriginal,
    valorResponsabilidade: parsed.valorTotalOriginal,
  });

  return purchase;
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
