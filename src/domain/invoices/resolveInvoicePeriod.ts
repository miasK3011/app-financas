import { clampDayToMonth } from '@/domain/shared/dateClamp';

/**
 * Determina em qual mês de referência de fatura uma compra cai, dado o
 * dia de fechamento do cartão (FR-002). O que acontece com uma compra
 * feita NO PRÓPRIO dia do fechamento depende do cartão (issue #16):
 * alguns fecham às 00:00 desse dia (ex.: Nubank — a compra já vai para
 * a fatura seguinte, `compraNoFechamentoVaiParaProxima = true`), outros
 * às 23:59 (ex.: Mercado Pago — a compra ainda entra no ciclo que fecha
 * naquele dia, `false`).
 */
export function resolveInvoicePeriod(
  cardClosingDay: number,
  purchaseDate: Date,
  compraNoFechamentoVaiParaProxima = false,
): { year: number; month: number } {
  const year = purchaseDate.getFullYear();
  const month = purchaseDate.getMonth() + 1; // 1-12

  const closingDay = clampDayToMonth(cardClosingDay, year, month).getDate();
  const purchaseDay = purchaseDate.getDate();

  const inCurrentCycle = compraNoFechamentoVaiParaProxima
    ? purchaseDay < closingDay
    : purchaseDay <= closingDay;

  if (inCurrentCycle) {
    return { year, month };
  }

  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}
