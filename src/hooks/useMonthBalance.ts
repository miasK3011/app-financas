import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { computeMonthBalance } from '@/domain/cashflow/computeMonthBalance';
import {
  type CashEntry,
  type CashEntryInput,
  createCashEntry,
  deleteCashEntry,
  listCashEntriesForMonth,
} from '@/repositories/cashEntriesRepository';
import { getIncomeForMonth } from '@/repositories/incomeConfigRepository';
import { listInvoicesDueInMonth } from '@/repositories/invoicesRepository';
import { listPixPurchasesForMonth } from '@/repositories/purchasesRepository';

/**
 * Saldo do mês (FR-015) + as entradas avulsas do mês, para a tela
 * Renda & Entradas · Main.
 */
export function useMonthBalance(year: number, month: number) {
  const [balance, setBalance] = useState(0);
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [hasIncome, setHasIncome] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [income, cashEntries, pixPurchases, dueInvoices] = await Promise.all([
      getIncomeForMonth(year, month),
      listCashEntriesForMonth(year, month),
      listPixPurchasesForMonth(year, month),
      listInvoicesDueInMonth(year, month),
    ]);

    setHasIncome(Boolean(income));
    setEntries(cashEntries);
    setBalance(
      computeMonthBalance({
        rendaVigente: income?.valor ?? null,
        entradasAvulsas: cashEntries.map((entry) => entry.valor),
        comprasPix: pixPurchases.map((purchase) => purchase.valorTotalOriginal),
        faturasVencendo: dueInvoices.map((invoice) => invoice.total),
      }),
    );
    setLoading(false);
  }, [year, month]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const addEntry = useCallback(
    async (input: CashEntryInput) => {
      await createCashEntry(input);
      await refresh();
    },
    [refresh],
  );

  const removeEntry = useCallback(
    async (id: string) => {
      await deleteCashEntry(id);
      await refresh();
    },
    [refresh],
  );

  return { balance, entries, hasIncome, loading, refresh, addEntry, removeEntry };
}
