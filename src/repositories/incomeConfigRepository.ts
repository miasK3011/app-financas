import { desc, lt } from 'drizzle-orm';
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
 * Valor de maior `vigenteDesde` que seja anterior ao FIM do mês pedido
 * — não ao início. Correção sobre a redação original de
 * `data-model.md` ("≤ o início daquele mês"): se o usuário atualiza a
 * renda hoje, no meio do mês, `vigenteDesde` é hoje — comparar contra
 * o início do mês (dia 1) faria essa renda nunca aparecer no mês
 * corrente, quebrando o cenário 1 da User Story 2 ("o saldo do mês
 * corrente passa a refletir o novo valor imediatamente", FR-013).
 * `undefined` quando nenhuma renda foi configurada ainda (Edge Case:
 * Estatísticas sem renda configurada).
 */
export async function getIncomeForMonth(
  year: number,
  month: number,
): Promise<IncomeConfig | undefined> {
  const nextMonthStart = new Date(year, month, 1);
  const [config] = await db
    .select()
    .from(configuracoesRenda)
    .where(lt(configuracoesRenda.vigenteDesde, nextMonthStart))
    .orderBy(desc(configuracoesRenda.vigenteDesde))
    .limit(1);
  return config;
}

/** Histórico completo, mais recente primeiro (Renda & Entradas · aba Histórico). */
export async function listIncomeHistory(): Promise<IncomeConfig[]> {
  return db.select().from(configuracoesRenda).orderBy(desc(configuracoesRenda.vigenteDesde));
}
