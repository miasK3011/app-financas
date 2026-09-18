import { randomUUID } from 'expo-crypto';

import { db } from '@/db/client';
import { metaConsumoIdeal } from '@/db/schema';

/**
 * `MetaConsumoIdeal` é singleton (data-model.md) — ausência da linha
 * ⇒ seção de "consumo ideal" não aparece nas Estatísticas (FR-042).
 */
export async function getIdealGoalPercent(): Promise<number | null> {
  const [row] = await db.select().from(metaConsumoIdeal);
  return row?.percentualDaRenda ?? null;
}

/** Substitui a meta vigente (nunca duas linhas) — `percent` é uma fração, ex.: `0.7` = 70%. */
export async function setIdealGoalPercent(percent: number): Promise<void> {
  await db.delete(metaConsumoIdeal);
  await db.insert(metaConsumoIdeal).values({ id: randomUUID(), percentualDaRenda: percent });
}

/** Remove a meta configurada — a seção correspondente volta a não aparecer. */
export async function clearIdealGoal(): Promise<void> {
  await db.delete(metaConsumoIdeal);
}
