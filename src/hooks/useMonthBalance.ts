import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { balanceEntries } from '@/domain/cashflow/balanceEntries';
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
 * Renda & Entradas · Main e a Início. Desde a feature 003 (FR-001/FR-002)
 * o saldo e `expenses` descontam só a parte do usuário — Pix por
 * `parteUsuario`, faturas por `totalResponsabilidade` — e reembolsos
 * vinculados não entram de novo como entrada (FR-001a). `entries`
 * continua trazendo todas as entradas do mês.
 */
export function useMonthBalance(year: number, month: number) {
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [hasIncome, setHasIncome] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [incomeConfig, cashEntries, pixPurchases, dueInvoices] = await Promise.all([
      getIncomeForMonth(year, month),
      listCashEntriesForMonth(year, month),
      listPixPurchasesForMonth(year, month),
      listInvoicesDueInMonth(year, month),
    ]);

    const pixShares = pixPurchases.map((purchase) => purchase.parteUsuario);
    const invoiceShares = dueInvoices.map((invoice) => invoice.totalResponsabilidade);
    const pixTotal = pixShares.reduce((sum, value) => sum + value, 0);
    const invoicesTotal = invoiceShares.reduce((sum, value) => sum + value, 0);

    setHasIncome(Boolean(incomeConfig));
    setEntries(cashEntries);
    setIncome(incomeConfig?.valor ?? 0);
    setExpenses(pixTotal + invoicesTotal);
    setBalance(
      computeMonthBalance({
        rendaVigente: incomeConfig?.valor ?? null,
        entradasAvulsas: balanceEntries(cashEntries),
        comprasPix: pixShares,
        faturasVencendo: invoiceShares,
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

  return { balance, income, expenses, entries, hasIncome, loading, refresh, addEntry, removeEntry };
}
