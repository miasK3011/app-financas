import { randomUUID } from 'expo-crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { cartoes } from '@/db/schema';

export const cardInputSchema = z.object({
  nome: z.string().min(1),
  diaFechamento: z.number().int().min(1).max(31),
  diaVencimento: z.number().int().min(1).max(31),
});

export type CardInput = z.infer<typeof cardInputSchema>;
export type Card = typeof cartoes.$inferSelect;

export async function createCard(input: CardInput): Promise<Card> {
  const { nome, diaFechamento, diaVencimento } = cardInputSchema.parse(input);

  const [card] = await db
    .insert(cartoes)
    .values({
      id: randomUUID(),
      nome,
      diaFechamento,
      diaVencimento,
      arquivadoEm: null,
      criadoEm: new Date(),
    })
    .returning();

  return card;
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
