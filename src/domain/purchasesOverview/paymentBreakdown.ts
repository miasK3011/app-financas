import type { FormaPagamento, PaymentBreakdown } from './types';

type BreakdownRow = {
  valor: number;
  valorResponsabilidade: number;
  formaPagamento: FormaPagamento;
};

/**
 * FR-010 (002): soma `valor` de todas as `rows` em `total`; agrupa a soma
 * por `formaPagamento`, omitindo do array qualquer forma de pagamento com
 * soma zero (a barra/legenda só mostra o que existe naquele mês).
 * FR-009 (003): soma também a parte do usuário em `totalResponsabilidade`.
 * Recebe as linhas já filtradas — o card reflete o que a lista mostra.
 */
export function computeBreakdown(rows: BreakdownRow[]): PaymentBreakdown {
  const totals = new Map<FormaPagamento, number>();

  for (const row of rows) {
    totals.set(row.formaPagamento, (totals.get(row.formaPagamento) ?? 0) + row.valor);
  }

  const total = rows.reduce((sum, row) => sum + row.valor, 0);
  const totalResponsabilidade = rows.reduce((sum, row) => sum + row.valorResponsabilidade, 0);
  const porFormaPagamento = Array.from(totals.entries())
    .filter(([, valorTotal]) => valorTotal !== 0)
    .map(([formaPagamento, valorTotal]) => ({ formaPagamento, total: valorTotal }));

  return { total, totalResponsabilidade, porFormaPagamento };
}
