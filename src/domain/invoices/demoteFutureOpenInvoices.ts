import type { InvoiceStatus } from './computeInvoiceStatus';

export type DemotableInvoice = {
  id: string;
  cartaoId: string;
  dataFechamento: Date;
  status: InvoiceStatus;
};

/**
 * Uma compra parcelada aloca, na hora da compra, uma Fatura para cada
 * mês futuro das parcelas restantes (`allocateInstallmentsToInvoices`)
 * — então um cartão pode ter várias faturas `ABERTA` simultaneamente
 * mesmo só uma estando de fato em andamento (a de fechamento mais
 * próximo). As demais só existem como alocação antecipada e não devem
 * contar como "em aberto" ainda; são reclassificadas para `FUTURA`.
 */
export function demoteFutureOpenInvoices<T extends DemotableInvoice>(invoices: T[]): T[] {
  const earliestOpenByCard = new Map<string, T>();
  for (const invoice of invoices) {
    if (invoice.status !== 'ABERTA') continue;
    const current = earliestOpenByCard.get(invoice.cartaoId);
    if (!current || invoice.dataFechamento < current.dataFechamento) {
      earliestOpenByCard.set(invoice.cartaoId, invoice);
    }
  }

  return invoices.map((invoice) => {
    if (invoice.status !== 'ABERTA') return invoice;
    const earliest = earliestOpenByCard.get(invoice.cartaoId);
    return earliest && earliest.id !== invoice.id ? { ...invoice, status: 'FUTURA' } : invoice;
  });
}
