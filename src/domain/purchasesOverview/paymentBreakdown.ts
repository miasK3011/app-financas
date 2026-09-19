import type { FormaPagamento, PaymentBreakdown, PurchaseListRow } from './types';

/**
 * FR-010: soma `valor` de todas as `rows` em `total`; agrupa a soma por
 * `formaPagamento`, omitindo do array qualquer forma de pagamento com
 * soma zero (a barra/legenda só mostra o que existe naquele mês).
 */
export function computeBreakdown(rows: PurchaseListRow[]): PaymentBreakdown {
  const totals = new Map<FormaPagamento, number>();

  for (const row of rows) {
    totals.set(row.formaPagamento, (totals.get(row.formaPagamento) ?? 0) + row.valor);
  }

  const total = rows.reduce((sum, row) => sum + row.valor, 0);
  const porFormaPagamento = Array.from(totals.entries())
    .filter(([, valorTotal]) => valorTotal !== 0)
    .map(([formaPagamento, valorTotal]) => ({ formaPagamento, total: valorTotal }));

  return { total, porFormaPagamento };
}
