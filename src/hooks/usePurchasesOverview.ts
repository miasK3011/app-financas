import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { computeMonthRange } from '@/domain/purchasesOverview/monthRange';
import type { MonthRange, PurchaseListRow } from '@/domain/purchasesOverview/types';
import {
  type ForecastInvoiceGroup,
  getEarliestCompraDate,
  listForecastInvoicesForMonth,
  listPurchasesForMonth,
} from '@/repositories/purchasesRepository';
import { listInvoiceDueDatesWithParcela } from '@/repositories/invoicesRepository';

/** Tela Compras (mês atual/passado): todas as Parcelas (cartão + Pix) do mês. */
export function useMonthPurchases(year: number, month: number) {
  const [rows, setRows] = useState<PurchaseListRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setRows(await listPurchasesForMonth(year, month));
    setLoading(false);
  }, [year, month]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { rows, loading, refresh };
}

/** FR-008/FR-009: limites de navegação do `MonthNavigator` — recalculado a cada foco da tela. */
export function useMonthRange() {
  const [range, setRange] = useState<MonthRange>({ earliest: undefined, latest: undefined });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [earliestCompraDate, invoiceDueDatesWithParcela] = await Promise.all([
      getEarliestCompraDate(),
      listInvoiceDueDatesWithParcela(),
    ]);
    setRange(computeMonthRange(earliestCompraDate, invoiceDueDatesWithParcela, new Date()));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { range, loading, refresh };
}

/** Tela Compras, mês futuro previsto (FR-013): parcelas já lançadas, agrupadas por fatura. */
export function useForecastInvoices(year: number, month: number) {
  const [groups, setGroups] = useState<ForecastInvoiceGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setGroups(await listForecastInvoicesForMonth(year, month));
    setLoading(false);
  }, [year, month]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { groups, loading, refresh };
}
