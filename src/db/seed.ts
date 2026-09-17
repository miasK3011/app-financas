import { randomUUID } from 'expo-crypto';

import { db } from './client';
import { categorias } from './schema';

/**
 * Categorias pré-definidas (FR-027). "Outros" é o fallback genérico
 * final (FR-030) e nunca pode ser excluída (FR-037) — ver
 * data-model.md § Categoria.
 */
const PREDEFINED_CATEGORIES = [
  { nome: 'Compras', icone: 'ShoppingBag' },
  { nome: 'Transporte', icone: 'Car' },
  { nome: 'Alimentação', icone: 'Utensils' },
  { nome: 'Assinaturas', icone: 'Repeat' },
  { nome: 'Saúde', icone: 'HeartPulse' },
  { nome: 'Lazer', icone: 'Gamepad2' },
  { nome: 'Outros', icone: 'Shapes' },
] as const;

/**
 * Idempotent: only inserts the predefined set the first time the app
 * boots on a fresh database. Safe to call on every boot.
 */
export async function seedPredefinedCategories(): Promise<void> {
  const existing = await db.select().from(categorias).limit(1);
  if (existing.length > 0) {
    return;
  }

  await db.insert(categorias).values(
    PREDEFINED_CATEGORIES.map((categoria) => ({
      id: randomUUID(),
      nome: categoria.nome,
      icone: categoria.icone,
      predefinida: true,
    })),
  );
}
