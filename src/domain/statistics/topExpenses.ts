import { amountOf } from './amountOf';
import type { ParcelaComCompra, SpendingBasis } from './types';

/** FR-044: as `limit` compras (parcelas) de maior valor conforme `basis`. */
export function topExpenses(
  parcelas: ParcelaComCompra[],
  limit: number,
  basis: SpendingBasis = 'minha',
): ParcelaComCompra[] {
  return [...parcelas].sort((a, b) => amountOf(b, basis) - amountOf(a, basis)).slice(0, limit);
}
