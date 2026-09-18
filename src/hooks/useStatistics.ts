import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { PeriodKind } from '@/domain/statistics/types';
import { getStatistics, type StatisticsResult } from '@/repositories/statisticsRepository';

/** T096: estatísticas do período selecionado, recalculadas a cada foco de tela. */
export function useStatistics(kind: PeriodKind) {
  const [stats, setStats] = useState<StatisticsResult | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setStats(await getStatistics(kind, new Date()));
    setLoading(false);
  }, [kind]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { stats, loading, refresh };
}
