import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  getIncomeForMonth,
  type IncomeConfig,
  listIncomeHistory,
  setIncome,
} from '@/repositories/incomeConfigRepository';

/** Renda vigente para um (ano, mês) específico — `undefined` se nenhuma configurada ainda. */
export function useIncome(year: number, month: number) {
  const [income, setIncomeState] = useState<IncomeConfig>();
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setIncomeState(await getIncomeForMonth(year, month));
    setLoading(false);
  }, [year, month]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const updateIncome = useCallback(
    async (valor: number, vigenteDesde: Date) => {
      await setIncome(valor, vigenteDesde);
      await refresh();
    },
    [refresh],
  );

  return { income, loading, refresh, updateIncome };
}

/** Histórico completo de valores de renda (aba Histórico). */
export function useIncomeHistory() {
  const [history, setHistory] = useState<IncomeConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setHistory(await listIncomeHistory());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { history, loading, refresh };
}
