import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { PeriodKind, SpendingBasis } from '@/domain/statistics/types';
import { getStatistics, type StatisticsResult } from '@/repositories/statisticsRepository';

/**
 * T096: estatísticas do período selecionado, recalculadas a cada foco de
 * tela. `basis` (feature 003) escolhe Meu gasto × Global; `anchor` permite
 * a uma tela de detalhe reabrir o mesmo período (padrão: agora).
 */
export function useStatistics(kind: PeriodKind, basis: SpendingBasis = 'minha', anchor?: Date) {
  const [stats, setStats] = useState<StatisticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const anchorTime = anchor?.getTime();

  const refresh = useCallback(async () => {
    setLoading(true);
    setStats(
      await getStatistics(
        kind,
        anchorTime === undefined ? new Date() : new Date(anchorTime),
        basis,
      ),
    );
    setLoading(false);
  }, [kind, basis, anchorTime]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { stats, loading, refresh };
}
