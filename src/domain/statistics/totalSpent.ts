import { amountOf } from './amountOf';
import type { ParcelaComCompra, SpendingBasis } from './types';

/**
 * FR-040/FR-054: com `'minha'` (padrão) soma `valorResponsabilidade` — o
 * gasto pessoal real; com `'global'` soma `valor` (FR-003 da feature 003).
 */
export function totalSpent(parcelas: ParcelaComCompra[], basis: SpendingBasis = 'minha'): number {
  return parcelas.reduce((sum, parcela) => sum + amountOf(parcela, basis), 0);
}
