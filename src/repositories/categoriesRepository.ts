import { eq } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import { z } from 'zod';

import { db } from '@/db/client';
import { categorias, compras } from '@/db/schema';

export type Category = typeof categorias.$inferSelect;

export const categoryInputSchema = z.object({
  nome: z.string().min(1),
  icone: z.string().min(1),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export async function listCategories(): Promise<Category[]> {
  return db.select().from(categorias);
}

/** FR-028: categoria personalizada (nunca `predefinida`). */
export async function createCategory(input: CategoryInput): Promise<Category> {
  const parsed = categoryInputSchema.parse(input);
  const [category] = await db
    .insert(categorias)
    .values({ id: randomUUID(), nome: parsed.nome, icone: parsed.icone, predefinida: false })
    .returning();
  return category;
}

/**
 * FR-037: exclui uma Categoria personalizada; toda Compra que a usava
 * passa a exibir o ícone genérico "Outros" (via `categoriaId = NULL` —
 * FR-030 já resolve o fallback visual, não precisa reatribuir
 * explicitamente). Nunca permite excluir uma Categoria pré-definida.
 */
export async function deleteCategory(id: string): Promise<void> {
  const [category] = await db.select().from(categorias).where(eq(categorias.id, id));
  if (!category) return;
  if (category.predefinida) {
    throw new Error('Categorias pré-definidas não podem ser excluídas');
  }

  await db.update(compras).set({ categoriaId: null }).where(eq(compras.categoriaId, id));
  await db.delete(categorias).where(eq(categorias.id, id));
}
