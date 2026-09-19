import { desc, eq } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import { z } from 'zod';

import { db } from '@/db/client';
import { lancamentosReserva } from '@/db/schema';

export type ReserveEntry = typeof lancamentosReserva.$inferSelect;

/**
 * `RENDIMENTO_AUTOMATICO` existe na coluna do banco (feature futura,
 * FR-021) mas nenhum código desta versão o gera — por isso não faz
 * parte das opções aceitas aqui (Princípio V / Assumption).
 */
export const reserveEntryInputSchema = z.object({
  reservaId: z.string().min(1),
  tipo: z.enum(['DEPOSITO', 'RETIRADA', 'RENDIMENTO_MANUAL']),
  /** Sempre a magnitude positiva digitada pelo usuário — o sinal do tipo é aplicado ao salvar. */
  valor: z.number().int().positive(),
  data: z.date(),
  observacao: z.string().optional(),
});

export type ReserveEntryInput = z.infer<typeof reserveEntryInputSchema>;

/**
 * FR-020: o sinal já reflete o tipo ao persistir (retirada é negativa)
 * — data-model.md § Lançamento de Reserva — para que o saldo (soma
 * simples de `valor`) nunca precise saber o tipo de cada lançamento.
 */
export async function createReserveEntry(input: ReserveEntryInput): Promise<ReserveEntry> {
  const parsed = reserveEntryInputSchema.parse(input);
  const valorComSinal = parsed.tipo === 'RETIRADA' ? -parsed.valor : parsed.valor;

  const [entry] = await db
    .insert(lancamentosReserva)
    .values({
      id: randomUUID(),
      reservaId: parsed.reservaId,
      tipo: parsed.tipo,
      valor: valorComSinal,
      data: parsed.data,
      observacao: parsed.observacao,
    })
    .returning();
  return entry;
}

/** Extrato de uma Reserva, mais recente primeiro. */
export async function listReserveEntries(reservaId: string): Promise<ReserveEntry[]> {
  return db
    .select()
    .from(lancamentosReserva)
    .where(eq(lancamentosReserva.reservaId, reservaId))
    .orderBy(desc(lancamentosReserva.data));
}
