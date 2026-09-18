import { and, eq, gte, lt } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import { z } from 'zod';

import { db } from '@/db/client';
import { entradasAvulsas } from '@/db/schema';

import { recomputeResponsibility } from './purchasesRepository';

export const cashEntryInputSchema = z.object({
  descricao: z.string().min(1),
  valor: z.number().int().positive(),
  data: z.date(),
});

export type CashEntryInput = z.infer<typeof cashEntryInputSchema>;
export type CashEntry = typeof entradasAvulsas.$inferSelect;

/**
 * `compraVinculadaId`, quando informado, marca esta entrada como um
 * reembolso de uma Compra (FR-050) — dispara `recomputeResponsibility`
 * para essa Compra (US12/FR-051). A entrada sempre conta no saldo do
 * mês normalmente, vinculada ou não (data-model.md § Entrada Avulsa).
 */
export async function createCashEntry(
  input: CashEntryInput & { compraVinculadaId?: string },
): Promise<CashEntry> {
  const { compraVinculadaId, ...rest } = input;
  const parsed = cashEntryInputSchema.parse(rest);
  const [entry] = await db
    .insert(entradasAvulsas)
    .values({ id: randomUUID(), ...parsed, compraVinculadaId: compraVinculadaId ?? null })
    .returning();

  if (entry.compraVinculadaId) {
    await recomputeResponsibility(entry.compraVinculadaId);
  }
  return entry;
}

export async function listCashEntriesForMonth(year: number, month: number): Promise<CashEntry[]> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);
  return db
    .select()
    .from(entradasAvulsas)
    .where(and(gte(entradasAvulsas.data, monthStart), lt(entradasAvulsas.data, monthEnd)));
}

export async function listAllCashEntries(): Promise<CashEntry[]> {
  return db.select().from(entradasAvulsas);
}

/** Entradas avulsas já vinculadas como reembolso desta Compra (US12). */
export async function listCashEntriesLinkedToCompra(compraId: string): Promise<CashEntry[]> {
  return db.select().from(entradasAvulsas).where(eq(entradasAvulsas.compraVinculadaId, compraId));
}

/** FR-050/FR-051: vincula uma entrada já existente a uma Compra como reembolso. */
export async function linkCashEntryToCompra(entryId: string, compraId: string): Promise<void> {
  await db
    .update(entradasAvulsas)
    .set({ compraVinculadaId: compraId })
    .where(eq(entradasAvulsas.id, entryId));
  await recomputeResponsibility(compraId);
}

/**
 * Edge Case: desvincular volta a responsabilidade da Compra ao valor
 * manual (se houver) ou ao total — `recomputeResponsibility` já decide
 * isso via `resolveResponsibility`.
 */
export async function unlinkCashEntryFromCompra(entryId: string): Promise<void> {
  const [entry] = await db.select().from(entradasAvulsas).where(eq(entradasAvulsas.id, entryId));
  if (!entry?.compraVinculadaId) return;

  const compraId = entry.compraVinculadaId;
  await db
    .update(entradasAvulsas)
    .set({ compraVinculadaId: null })
    .where(eq(entradasAvulsas.id, entryId));
  await recomputeResponsibility(compraId);
}

export async function deleteCashEntry(id: string): Promise<void> {
  const [entry] = await db.select().from(entradasAvulsas).where(eq(entradasAvulsas.id, id));
  await db.delete(entradasAvulsas).where(eq(entradasAvulsas.id, id));
  if (entry?.compraVinculadaId) {
    await recomputeResponsibility(entry.compraVinculadaId);
  }
}
