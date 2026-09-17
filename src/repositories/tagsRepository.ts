import { eq } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';

import { db } from '@/db/client';
import { tags } from '@/db/schema';

export type Tag = typeof tags.$inferSelect;

export async function listTags(): Promise<Tag[]> {
  return db.select().from(tags);
}

/**
 * FR-007: cria a Tag se ainda não existir (por `nome`, que é
 * **UNIQUE** — data-model.md), ou retorna a existente. Distinto de
 * simplesmente persistir o vínculo `CompraTag` (isso é feito por quem
 * chama esta função, ex.: `purchasesRepository`).
 */
export async function findOrCreateTag(nome: string): Promise<Tag> {
  const [existing] = await db.select().from(tags).where(eq(tags.nome, nome));
  if (existing) {
    return existing;
  }

  const [tag] = await db.insert(tags).values({ id: randomUUID(), nome }).returning();
  return tag;
}
