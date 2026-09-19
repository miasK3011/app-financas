import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  type InvoiceWithTotals,
  getInvoiceWithTotals,
  listInvoicesDueInMonth,
  listInvoicesForCardWithTotals,
  listOpenInvoicesWithTotals,
  markInvoiceAsPaid,
} from '@/repositories/invoicesRepository';
import {
  type InvoicePurchaseRow,
  listPurchasesForInvoice,
} from '@/repositories/purchasesRepository';

// Todo hook aqui usa useFocusEffect, não useEffect: o React Navigation
// mantém a tela anterior montada na pilha, então voltar de "Nova Compra"
// ou "Marcar como paga" nunca remonta a tela de lista — só useFocusEffect
// refaz o fetch nesse retorno (ver o mesmo comentário em useCards.ts).

export function useInvoice(invoiceId: string | undefined) {
  const [invoice, setInvoice] = useState<InvoiceWithTotals>();
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!invoiceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setInvoice(await getInvoiceWithTotals(invoiceId));
    setLoading(false);
  }, [invoiceId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const markAsPaid = useCallback(async () => {
    if (!invoiceId) return;
    await markInvoiceAsPaid(invoiceId);
    await refresh();
  }, [invoiceId, refresh]);

  return { invoice, loading, refresh, markAsPaid };
}

/** Compras alocadas em uma Fatura (Fatura · Detalhe). */
export function useInvoicePurchases(invoiceId: string | undefined) {
  const [purchases, setPurchases] = useState<InvoicePurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!invoiceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setPurchases(await listPurchasesForInvoice(invoiceId));
    setLoading(false);
  }, [invoiceId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { purchases, loading, refresh };
}

/** Faturas de um cartão específico (Cartão · Faturas), com status/totais já calculados. */
export function useCardInvoices(cardId: string | undefined) {
  const [invoices, setInvoices] = useState<InvoiceWithTotals[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!cardId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setInvoices(await listInvoicesForCardWithTotals(cardId));
    setLoading(false);
  }, [cardId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { invoices, loading, refresh };
}

/** Soma de todas as faturas ainda não pagas, de todos os cartões (Cartões · Main). */
export function useOpenInvoicesTotal() {
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const openInvoices = await listOpenInvoicesWithTotals();
    setTotal(openInvoices.reduce((sum, invoice) => sum + invoice.total, 0));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { total, loading, refresh };
}

/**
 * Soma das faturas ainda não pagas, agrupada por cartão — Cartões·Main
 * (Main.dc.html) mostra o valor da fatura ao lado de cada cartão na
 * lista, não só o total geral.
 */
export function useOpenInvoicesByCard() {
  const [totalsByCard, setTotalsByCard] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const openInvoices = await listOpenInvoicesWithTotals();
    const totals: Record<string, number> = {};
    for (const invoice of openInvoices) {
      totals[invoice.cartaoId] = (totals[invoice.cartaoId] ?? 0) + invoice.total;
    }
    setTotalsByCard(totals);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { totalsByCard, loading, refresh };
}

/** Início · Main ("Faturas do mês"): faturas de todos os cartões que vencem no (ano, mês) dado. */
export function useInvoicesDueInMonth(year: number, month: number) {
  const [invoices, setInvoices] = useState<InvoiceWithTotals[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setInvoices(await listInvoicesDueInMonth(year, month));
    setLoading(false);
  }, [year, month]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { invoices, loading, refresh };
}
