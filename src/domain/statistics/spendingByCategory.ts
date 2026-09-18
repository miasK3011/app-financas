import type { ParcelaComCompra } from './types';

/** FR-043: agrupa por `Compra.categoriaId`, somando `valorResponsabilidade`. */
export function spendingByCategory(
  parcelas: ParcelaComCompra[],
): { categoriaId: string | null; total: number }[] {
  const totals = new Map<string | null, number>();
  for (const parcela of parcelas) {
    const key = parcela.compra.categoriaId;
    totals.set(key, (totals.get(key) ?? 0) + parcela.valorResponsabilidade);
  }
  return Array.from(totals.entries()).map(([categoriaId, total]) => ({ categoriaId, total }));
}
