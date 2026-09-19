import type { MonthKey, MonthRange } from './types';

function toMonthKey(date: Date): MonthKey {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function isAfter(a: MonthKey, b: MonthKey): boolean {
  return a.year !== b.year ? a.year > b.year : a.month > b.month;
}

/**
 * FR-008/FR-009: `earliest` = mês de `earliestCompraDate` (`undefined`
 * se `null` — nenhuma Compra cadastrada, estado vazio total). `latest`
 * = o maior entre o mês de `today` e o mês de
 * `max(invoiceDueDatesWithParcela)` (`today` quando a lista estiver
 * vazia — seta de avançar já desabilitada no mês corrente sem parcela
 * futura).
 */
export function computeMonthRange(
  earliestCompraDate: Date | null,
  invoiceDueDatesWithParcela: Date[],
  today: Date,
): MonthRange {
  const earliest = earliestCompraDate ? toMonthKey(earliestCompraDate) : undefined;

  const todayKey = toMonthKey(today);
  const furthestInvoiceKey = invoiceDueDatesWithParcela
    .map(toMonthKey)
    .reduce<MonthKey | undefined>(
      (furthest, key) => (!furthest || isAfter(key, furthest) ? key : furthest),
      undefined,
    );

  const latest =
    furthestInvoiceKey && isAfter(furthestInvoiceKey, todayKey) ? furthestInvoiceKey : todayKey;

  return { earliest, latest };
}
