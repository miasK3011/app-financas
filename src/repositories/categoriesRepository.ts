import { db } from '@/db/client';
import { categorias } from '@/db/schema';

export type Category = typeof categorias.$inferSelect;

/**
 * Versão mínima (User Story 4 — só leitura, para o drawer de categoria
 * da Nova Compra). CRUD completo (criar/excluir categoria
 * personalizada) chega na User Story 9, T067.
 */
export async function listCategories(): Promise<Category[]> {
  return db.select().from(categorias);
}
