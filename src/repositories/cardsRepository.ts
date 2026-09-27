import { randomUUID } from 'expo-crypto';
import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import {
  assinaturas,
  cartoes,
  compraTags,
  compras,
  entradasAvulsas,
  faturas,
  lotesImportacao,
  parcelas,
} from '@/db/schema';
import { allocateInstallmentNumber } from '@/domain/installments/allocateInstallmentsToInvoices';
import { computeInvoiceDates } from '@/domain/invoices/computeInvoiceDates';

import { deleteEmptyUnpaidInvoices, ensureInvoice } from './invoicesRepository';

export const cardInputSchema = z.object({
  nome: z.string().min(1),
  diaFechamento: z.number().int().min(1).max(31),
  diaVencimento: z.number().int().min(1).max(31),
  /** Issue #16 — ver `cartoes.compraNoFechamentoVaiParaProxima` em db/schema.ts. */
  compraNoFechamentoVaiParaProxima: z.boolean(),
});

export type CardInput = z.infer<typeof cardInputSchema>;
export type Card = typeof cartoes.$inferSelect;

export async function createCard(input: CardInput): Promise<Card> {
  const { nome, diaFechamento, diaVencimento, compraNoFechamentoVaiParaProxima } =
    cardInputSchema.parse(input);

  const [card] = await db
    .insert(cartoes)
    .values({
      id: randomUUID(),
      nome,
      diaFechamento,
      diaVencimento,
      compraNoFechamentoVaiParaProxima,
      arquivadoEm: null,
      criadoEm: new Date(),
    })
    .returning();

  return card;
}

/**
 * Tela Editar cartão. Se os dias ou a regra de fechamento mudarem, as
 * faturas NÃO PAGAS do cartão ganham as novas datas e cada Parcela que
 * não está numa fatura paga é realocada para o ciclo que a nova regra
 * indica (mesmo `allocateInstallmentNumber` da criação). Parcelas em
 * faturas pagas ficam onde estão — o histórico pago não muda.
 */
export async function updateCard(id: string, input: CardInput): Promise<void> {
  const parsed = cardInputSchema.parse(input);
  const current = await getCard(id);
  if (!current) throw new Error(`Cartão ${id} não encontrado`);

  const rulesChanged =
    current.diaFechamento !== parsed.diaFechamento ||
    current.diaVencimento !== parsed.diaVencimento ||
    current.compraNoFechamentoVaiParaProxima !== parsed.compraNoFechamentoVaiParaProxima;

  db.transaction((tx) => {
    tx.update(cartoes).set(parsed).where(eq(cartoes.id, id)).run();
    if (!rulesChanged) return;

    const card = { ...current, ...parsed };
    const unpaidInvoices = tx
      .select()
      .from(faturas)
      .where(and(eq(faturas.cartaoId, id), isNull(faturas.pagaEm)))
      .all();
    for (const invoice of unpaidInvoices) {
      const dates = computeInvoiceDates(card, invoice.referenciaAno, invoice.referenciaMes);
      tx.update(faturas).set(dates).where(eq(faturas.id, invoice.id)).run();
    }

    const movable = tx
      .select({ parcela: parcelas, compra: compras })
      .from(parcelas)
      .innerJoin(compras, eq(parcelas.compraId, compras.id))
      .innerJoin(faturas, eq(parcelas.faturaId, faturas.id))
      .where(and(eq(faturas.cartaoId, id), isNull(faturas.pagaEm)))
      .all();
    for (const { parcela, compra } of movable) {
      const anchorNumero = compra.origem === 'CSV_IMPORT' ? compra.parcelaAtual : 1;
      const { year, month } = allocateInstallmentNumber(
        parcela.numero,
        card,
        compra.dataCompra,
        anchorNumero,
      );
      const invoice = ensureInvoice(tx, card, year, month);
      if (invoice.id !== parcela.faturaId) {
        tx.update(parcelas).set({ faturaId: invoice.id }).where(eq(parcelas.id, parcela.id)).run();
      }
    }

    deleteEmptyUnpaidInvoices(tx, id);
  });
}

/** Cartões ativos — usados nas opções de nova compra e na sugestão de melhor cartão (FR-025). */
export async function listActiveCards(): Promise<Card[]> {
  return db.select().from(cartoes).where(isNull(cartoes.arquivadoEm));
}

/** Todos os cartões, incluindo arquivados — usado na tela Cartões · Main (histórico continua visível). */
export async function listAllCards(): Promise<Card[]> {
  return db.select().from(cartoes);
}

export async function getCard(id: string): Promise<Card | undefined> {
  const [card] = await db.select().from(cartoes).where(eq(cartoes.id, id));
  return card;
}

/**
 * Arquiva um cartão sem apagar seu histórico (FR-025). O cartão some das
 * opções de nova compra e da sugestão de melhor cartão, mas suas
 * faturas continuam existindo e sendo exibidas normalmente.
 */
export async function archiveCard(id: string): Promise<void> {
  await db
    .update(cartoes)
    .set({ arquivadoEm: new Date() })
    .where(and(eq(cartoes.id, id), isNull(cartoes.arquivadoEm)));
}

export async function unarchiveCard(id: string): Promise<void> {
  await db
    .update(cartoes)
    .set({ arquivadoEm: null })
    .where(and(eq(cartoes.id, id), isNotNull(cartoes.arquivadoEm)));
}

export type CardDeletionImpact = { compras: number; faturas: number; assinaturasAtivas: number };

/** Contagens para a confirmação de "Excluir cartão". */
export async function getCardDeletionImpact(id: string): Promise<CardDeletionImpact> {
  const [compraRows, faturaRows, assinaturaRows] = await Promise.all([
    db.select({ id: compras.id }).from(compras).where(eq(compras.cartaoId, id)),
    db.select({ id: faturas.id }).from(faturas).where(eq(faturas.cartaoId, id)),
    db
      .select({ id: assinaturas.id })
      .from(assinaturas)
      .where(and(eq(assinaturas.cartaoId, id), isNull(assinaturas.canceladaEm))),
  ]);
  return {
    compras: compraRows.length,
    faturas: faturaRows.length,
    assinaturasAtivas: assinaturaRows.length,
  };
}

/**
 * Exclusão definitiva de um cartão (alternativa a arquivar): apaga
 * faturas, parcelas, compras e lotes de importação do cartão. Assinaturas
 * vinculadas continuam existindo, mas ficam canceladas e sem cartão.
 * Entradas avulsas vinculadas a compras do cartão só perdem o vínculo.
 */
export async function deleteCard(id: string): Promise<void> {
  db.transaction((tx) => {
    const compraIds = tx
      .select({ id: compras.id })
      .from(compras)
      .where(eq(compras.cartaoId, id))
      .all()
      .map((row) => row.id);
    const faturaIds = tx
      .select({ id: faturas.id })
      .from(faturas)
      .where(eq(faturas.cartaoId, id))
      .all()
      .map((row) => row.id);

    tx.update(assinaturas)
      .set({ cartaoId: null, canceladaEm: new Date() })
      .where(and(eq(assinaturas.cartaoId, id), isNull(assinaturas.canceladaEm)))
      .run();
    tx.update(assinaturas).set({ cartaoId: null }).where(eq(assinaturas.cartaoId, id)).run();

    if (compraIds.length > 0) {
      tx.update(entradasAvulsas)
        .set({ compraVinculadaId: null })
        .where(inArray(entradasAvulsas.compraVinculadaId, compraIds))
        .run();
      tx.delete(compraTags).where(inArray(compraTags.compraId, compraIds)).run();
      tx.delete(parcelas).where(inArray(parcelas.compraId, compraIds)).run();
    }
    if (faturaIds.length > 0) {
      tx.delete(parcelas).where(inArray(parcelas.faturaId, faturaIds)).run();
    }
    tx.delete(compras).where(eq(compras.cartaoId, id)).run();
    tx.delete(faturas).where(eq(faturas.cartaoId, id)).run();
    tx.delete(lotesImportacao).where(eq(lotesImportacao.cartaoId, id)).run();
    tx.delete(cartoes).where(eq(cartoes.id, id)).run();
  });
}
