import type { ParcelaComCompra, SpendingBasis } from './types';

/** Valor de uma parcela conforme a base de cálculo escolhida (FR-003 da feature 003). */
export function amountOf(parcela: ParcelaComCompra, basis: SpendingBasis): number {
  return basis === 'global' ? parcela.valor : parcela.valorResponsabilidade;
}
