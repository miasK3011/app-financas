import { and, eq, gte, isNull, lte } from 'drizzle-orm';

import { db } from '@/db/client';
import { compras, faturas, parcelas } from '@/db/schema';
import { compareToPrevious } from '@/domain/statistics/compareToPrevious';
import { idealSpendComparison } from '@/domain/statistics/idealSpendComparison';
import { resolvePeriod } from '@/domain/statistics/resolvePeriod';
import { spendingByCategory } from '@/domain/statistics/spendingByCategory';
import { subscriptionsShare } from '@/domain/statistics/subscriptionsShare';
import { topExpenses } from '@/domain/statistics/topExpenses';
import { totalSpent } from '@/domain/statistics/totalSpent';
import type {
  ParcelaComCompra,
  Period,
  PeriodKind,
  SpendingBasis,
} from '@/domain/statistics/types';

import { getIdealGoalPercent } from './idealGoalRepository';
import { getIncomeForMonth } from './incomeConfigRepository';

function toParcelaComCompra(
  parcela: typeof parcelas.$inferSelect,
  compra: typeof compras.$inferSelect,
): ParcelaComCompra {
  return {
    parcelaId: parcela.id,
    valor: parcela.valor,
    valorResponsabilidade: parcela.valorResponsabilidade,
    compra: {
      id: compra.id,
      descricao: compra.descricao,
      categoriaId: compra.categoriaId,
      origem: compra.origem,
    },
  };
}

/**
 * FR-040: "a data de uma parcela" — Compra Pix usa `dataCompra`
 * (nunca tem Fatura); parcela de cartão usa a `dataVencimento` da sua
 * Fatura, já que é isso que atribui cada parcela ao ciclo em que ela
 * de fato "pesa" no orçamento (Assumption — não explicitada em
 * `research.md`).
 */
export async function listParcelasForPeriod(period: Period): Promise<ParcelaComCompra[]> {
  const pixRows = await db
    .select({ parcela: parcelas, compra: compras })
    .from(parcelas)
    .innerJoin(compras, eq(parcelas.compraId, compras.id))
    .where(
      and(
        isNull(parcelas.faturaId),
        gte(compras.dataCompra, period.start),
        lte(compras.dataCompra, period.end),
      ),
    );

  const cardRows = await db
    .select({ parcela: parcelas, compra: compras })
    .from(parcelas)
    .innerJoin(compras, eq(parcelas.compraId, compras.id))
    .innerJoin(faturas, eq(parcelas.faturaId, faturas.id))
    .where(and(gte(faturas.dataVencimento, period.start), lte(faturas.dataVencimento, period.end)));

  return [
    ...pixRows.map((row) => toParcelaComCompra(row.parcela, row.compra)),
    ...cardRows.map((row) => toParcelaComCompra(row.parcela, row.compra)),
  ];
}

export type StatisticsResult = {
  period: Period;
  basis: SpendingBasis;
  /** Total do período conforme `basis`. */
  totalSpent: number;
  /** Total do período sempre pela parte do usuário (FR-004/FR-005 da feature 003). */
  totalMinhaParte: number;
  comparison: { percent: number } | null;
  spendingByCategory: { categoriaId: string | null; total: number }[];
  topExpenses: ParcelaComCompra[];
  subscriptionsShare: { subscriptionsTotal: number; percent: number };
  idealSpend: { used: number; goalAmount: number } | null;
};

/**
 * T095/FR-038..FR-045: agrega tudo que a tela de Estatísticas precisa para
 * um período. `basis` (feature 003, FR-003) escolhe entre a parte do
 * usuário e o valor global; a meta de consumo ideal usa sempre a parte
 * do usuário (FR-005).
 */
export async function getStatistics(
  kind: PeriodKind,
  anchor: Date = new Date(),
  basis: SpendingBasis = 'minha',
): Promise<StatisticsResult> {
  const { current, previous } = resolvePeriod(kind, anchor);

  const [currentParcelas, previousParcelas, income, goalPercent] = await Promise.all([
    listParcelasForPeriod(current),
    listParcelasForPeriod(previous),
    getIncomeForMonth(anchor.getFullYear(), anchor.getMonth() + 1),
    getIdealGoalPercent(),
  ]);

  const total = totalSpent(currentParcelas, basis);
  const totalMinhaParte = totalSpent(currentParcelas, 'minha');
  const previousTotal = previousParcelas.length === 0 ? null : totalSpent(previousParcelas, basis);

  return {
    period: current,
    basis,
    totalSpent: total,
    totalMinhaParte,
    comparison: compareToPrevious(total, previousTotal),
    spendingByCategory: spendingByCategory(currentParcelas, basis),
    topExpenses: topExpenses(currentParcelas, 5, basis),
    subscriptionsShare: subscriptionsShare(currentParcelas, total, basis),
    idealSpend: idealSpendComparison(totalMinhaParte, income?.valor ?? null, goalPercent),
  };
}

export type MonthlySpending = { year: number; month: number; total: number };

/**
 * FR-038: histórico de gasto total mensal (via `MENSAL`/`totalSpent`)
 * dos últimos `months` meses (incluindo o corrente), ordenado do mais
 * antigo para o mais recente — base do gráfico compacto de Início.
 */
export async function getMonthlySpendingHistory(months: number = 6): Promise<MonthlySpending[]> {
  const today = new Date();
  const results: MonthlySpending[] = [];

  for (let offset = months - 1; offset >= 0; offset--) {
    const anchor = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const { current } = resolvePeriod('MENSAL', anchor);
    const parcelasDoMes = await listParcelasForPeriod(current);
    results.push({
      year: anchor.getFullYear(),
      month: anchor.getMonth() + 1,
      total: totalSpent(parcelasDoMes),
    });
  }

  return results;
}
