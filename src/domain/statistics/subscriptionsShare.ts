import { amountOf } from './amountOf';
import type { ParcelaComCompra, SpendingBasis } from './types';

/**
 * FR-045: percentual do gasto do próprio período (não da renda) que
 * corresponde a assinaturas recorrentes (`Compra.origem === 'ASSINATURA'`).
 */
export function subscriptionsShare(
  parcelas: ParcelaComCompra[],
  totalSpentValue: number,
  basis: SpendingBasis = 'minha',
): { subscriptionsTotal: number; percent: number } {
  const subscriptionsTotal = parcelas
    .filter((parcela) => parcela.compra.origem === 'ASSINATURA')
    .reduce((sum, parcela) => sum + amountOf(parcela, basis), 0);

  const percent = totalSpentValue === 0 ? 0 : subscriptionsTotal / totalSpentValue;
  return { subscriptionsTotal, percent };
}
