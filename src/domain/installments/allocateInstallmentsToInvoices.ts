import { resolveInvoicePeriod } from '@/domain/invoices/resolveInvoicePeriod';

import type { InstallmentPlan } from './splitInstallments';

export type InvoiceAllocation = { numero: number; year: number; month: number };

/**
 * A primeira entrada do plano (a `parcelaAtual`) vai para o ciclo
 * resolvido por `resolveInvoicePeriod` a partir da data da compra; cada
 * entrada seguinte vai para o mês consecutivo, sem pular nenhum. O
 * chamador (repositório) deve garantir — via
 * `invoicesRepository.getOrCreateInvoice` — que cada Fatura exista
 * antes de inserir a Parcela correspondente.
 */
export function allocateInstallmentsToInvoices(
  plan: InstallmentPlan[],
  card: { diaFechamento: number },
  purchaseDate: Date,
): InvoiceAllocation[] {
  if (plan.length === 0) return [];

  let { year, month } = resolveInvoicePeriod(card.diaFechamento, purchaseDate);

  return plan.map((installment, index) => {
    if (index > 0) {
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
    return { numero: installment.numero, year, month };
  });
}
