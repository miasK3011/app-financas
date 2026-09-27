import { resolveInvoicePeriod } from '@/domain/invoices/resolveInvoicePeriod';

import type { InstallmentPlan } from './splitInstallments';

export type InvoiceAllocation = { numero: number; year: number; month: number };

export type AllocationCard = {
  diaFechamento: number;
  compraNoFechamentoVaiParaProxima?: boolean;
};

/**
 * A parcela `anchorNumero` cai no ciclo resolvido por
 * `resolveInvoicePeriod` a partir de `purchaseDate`, e cada parcela `k`
 * cai `k - anchorNumero` meses depois (ou antes). Cadastro manual usa
 * `anchorNumero = 1` — a data informada é a da compra ORIGINAL (issue
 * #18): a parcela 4 de uma compra de maio cai em agosto. Importação CSV
 * passa a `parcelaAtual` da linha ("Parcela 4/10") como âncora, porque
 * a data da linha é a da cobrança daquela parcela (FR-006). O chamador
 * (repositório) deve garantir — via `invoicesRepository.getOrCreateInvoice`
 * — que cada Fatura exista antes de inserir a Parcela correspondente.
 */
export function allocateInstallmentsToInvoices(
  plan: InstallmentPlan[],
  card: AllocationCard,
  purchaseDate: Date,
  anchorNumero = 1,
): InvoiceAllocation[] {
  return plan.map((installment) => ({
    numero: installment.numero,
    ...allocateInstallmentNumber(installment.numero, card, purchaseDate, anchorNumero),
  }));
}

/** Ciclo (ano, mês) da parcela `numero` — ver `allocateInstallmentsToInvoices`. */
export function allocateInstallmentNumber(
  numero: number,
  card: AllocationCard,
  purchaseDate: Date,
  anchorNumero = 1,
): { year: number; month: number } {
  const anchor = resolveInvoicePeriod(
    card.diaFechamento,
    purchaseDate,
    card.compraNoFechamentoVaiParaProxima,
  );
  const monthIndex = anchor.year * 12 + (anchor.month - 1) + (numero - anchorNumero);
  return { year: Math.floor(monthIndex / 12), month: (monthIndex % 12) + 1 };
}
