import { eq, isNull } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import { z } from 'zod';

import { db } from '@/db/client';
import { lancamentosReserva, reservas } from '@/db/schema';

export type Reserve = typeof reservas.$inferSelect;

export const reserveInputSchema = z.object({
  nome: z.string().min(1),
  taxaRendimentoMensalPercentual: z.number().optional(),
});

export type ReserveInput = z.infer<typeof reserveInputSchema>;

export async function createReserve(input: ReserveInput): Promise<Reserve> {
  const parsed = reserveInputSchema.parse(input);
  const [reserve] = await db
    .insert(reservas)
    .values({
      id: randomUUID(),
      nome: parsed.nome,
      taxaRendimentoMensalPercentual: parsed.taxaRendimentoMensalPercentual ?? null,
      arquivadoEm: null,
    })
    .returning();
  return reserve;
}

export type UpdateReserveInput = {
  nome?: string;
  taxaRendimentoMensalPercentual?: number | null;
};

export async function updateReserve(id: string, updates: UpdateReserveInput): Promise<void> {
  await db.update(reservas).set(updates).where(eq(reservas.id, id));
}

/** FR-019 — reservas ainda não arquivadas. */
export async function listReserves(): Promise<Reserve[]> {
  return db.select().from(reservas).where(isNull(reservas.arquivadoEm));
}

export async function getReserve(id: string): Promise<Reserve | undefined> {
  const [reserve] = await db.select().from(reservas).where(eq(reservas.id, id));
  return reserve;
}

/**
 * O saldo NUNCA é uma coluna própria — é sempre a soma de
 * `LancamentoReserva.valor` (depósitos/rendimentos positivos,
 * retiradas negativas), mesmo princípio já aplicado à Fatura
 * (data-model.md § Reserva de Dinheiro Guardado).
 */
export async function getReserveBalance(reserveId: string): Promise<number> {
  const entries = await db
    .select({ valor: lancamentosReserva.valor })
    .from(lancamentosReserva)
    .where(eq(lancamentosReserva.reservaId, reserveId));
  return entries.reduce((sum, entry) => sum + entry.valor, 0);
}
