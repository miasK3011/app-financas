import { amountOf } from './amountOf';
import type { ParcelaComCompra, SpendingBasis } from './types';

/** FR-043: agrupa por `Compra.categoriaId`, somando o valor conforme `basis`. */
export function spendingByCategory(
  parcelas: ParcelaComCompra[],
  basis: SpendingBasis = 'minha',
): { categoriaId: string | null; total: number }[] {
  const totals = new Map<string | null, number>();
  for (const parcela of parcelas) {
    const key = parcela.compra.categoriaId;
    totals.set(key, (totals.get(key) ?? 0) + amountOf(parcela, basis));
  }
  return Array.from(totals.entries()).map(([categoriaId, total]) => ({ categoriaId, total }));
}
