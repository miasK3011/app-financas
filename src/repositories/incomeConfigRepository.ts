import { desc, lte } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';

import { db } from '@/db/client';
import { configuracoesRenda } from '@/db/schema';

export type IncomeConfig = typeof configuracoesRenda.$inferSelect;

/**
 * FR-013: sempre INSERE um novo registro — nunca sobrescreve/apaga o
 * valor vigente em meses anteriores. O histórico é a lista completa de
 * linhas desta tabela.
 */
export async function setIncome(valor: number, vigenteDesde: Date): Promise<IncomeConfig> {
  const [config] = await db
    .insert(configuracoesRenda)
    .values({ id: randomUUID(), valor, vigenteDesde })
    .returning();
  return config;
}

/**
 * Valor de maior `vigenteDesde` que seja ≤ o início do mês pedido —
 * `undefined` quando nenhuma renda foi configurada ainda (Edge Case:
 * Estatísticas sem renda configurada).
 */
export async function getIncomeForMonth(
  year: number,
  month: number,
): Promise<IncomeConfig | undefined> {
  const monthStart = new Date(year, month - 1, 1);
  const [config] = await db
    .select()
    .from(configuracoesRenda)
    .where(lte(configuracoesRenda.vigenteDesde, monthStart))
    .orderBy(desc(configuracoesRenda.vigenteDesde))
    .limit(1);
  return config;
}

/** Histórico completo, mais recente primeiro (Renda & Entradas · aba Histórico). */
export async function listIncomeHistory(): Promise<IncomeConfig[]> {
  return db.select().from(configuracoesRenda).orderBy(desc(configuracoesRenda.vigenteDesde));
}
