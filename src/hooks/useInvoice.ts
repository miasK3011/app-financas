import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  type InvoiceWithTotals,
  getInvoiceWithTotals,
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
