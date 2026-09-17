import { clampDayToMonth } from '@/domain/shared/dateClamp';

/**
 * Determina em qual mês de referência de fatura uma compra cai, dado o
 * dia de fechamento do cartão (FR-002). Uma compra no dia exato do
 * fechamento entra no ciclo que fecha naquele mesmo dia — não no
 * seguinte (User Story 1, cenário 2).
 */
export function resolveInvoicePeriod(
  cardClosingDay: number,
  purchaseDate: Date,
): { year: number; month: number } {
  const year = purchaseDate.getFullYear();
  const month = purchaseDate.getMonth() + 1; // 1-12

  const closingDateThisMonth = clampDayToMonth(cardClosingDay, year, month);

  if (purchaseDate.getDate() <= closingDateThisMonth.getDate()) {
    return { year, month };
  }

  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}
