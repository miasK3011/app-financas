import { and, eq, gte, lt } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import { z } from 'zod';

import { db } from '@/db/client';
import { entradasAvulsas } from '@/db/schema';

export const cashEntryInputSchema = z.object({
  descricao: z.string().min(1),
  valor: z.number().int().positive(),
  data: z.date(),
});

export type CashEntryInput = z.infer<typeof cashEntryInputSchema>;
export type CashEntry = typeof entradasAvulsas.$inferSelect;

export async function createCashEntry(input: CashEntryInput): Promise<CashEntry> {
  const parsed = cashEntryInputSchema.parse(input);
  const [entry] = await db
    .insert(entradasAvulsas)
    .values({ id: randomUUID(), ...parsed, compraVinculadaId: null })
    .returning();
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

export async function deleteCashEntry(id: string): Promise<void> {
  await db.delete(entradasAvulsas).where(eq(entradasAvulsas.id, id));
}
