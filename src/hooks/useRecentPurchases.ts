import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { listRecentPurchases, type RecentPurchaseRow } from '@/repositories/purchasesRepository';

/** Início · Main ("Transações recentes"): últimas N Compras registradas. */
export function useRecentPurchases(limit: number) {
  const [purchases, setPurchases] = useState<RecentPurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setPurchases(await listRecentPurchases(limit));
    setLoading(false);
  }, [limit]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { purchases, loading, refresh };
}
