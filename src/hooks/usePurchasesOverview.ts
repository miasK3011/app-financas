import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { PurchaseListRow } from '@/domain/purchasesOverview/types';
import { listPurchasesForMonth } from '@/repositories/purchasesRepository';

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
