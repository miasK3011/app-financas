import { resolveInvoicePeriod } from '@/domain/invoices/resolveInvoicePeriod';

import { allocateInstallmentNumber, type AllocationCard } from './allocateInstallmentsToInvoices';

/**
 * Qual parcela de uma compra feita em `dataCompra` cai no ciclo de
 * fatura em andamento `today` — base da dica "Hoje na parcela X de N"
 * do formulário de compra (issue #18). `0` = nenhuma parcela ainda (compra
 * com data futura); `parcelasTotal + 1` = parcelamento já terminou.
 */
export function currentInstallmentNumber(
  dataCompra: Date,
  parcelasTotal: number,
  card: AllocationCard,
  today: Date,
): number {
  const current = resolveInvoicePeriod(
    card.diaFechamento,
    today,
    card.compraNoFechamentoVaiParaProxima,
  );
  const first = allocateInstallmentNumber(1, card, dataCompra);
  const offset = current.year * 12 + current.month - (first.year * 12 + first.month);
  return Math.max(0, Math.min(parcelasTotal + 1, offset + 1));
}
