import { recomputeSplitOnRefund } from '@/domain/installments/recomputeSplitOnRefund';

export type CompraForResponsibility = {
  valorTotalOriginal: number;
  valorResponsabilidade: number | null;
};

/**
 * `responsabilidadeEfetiva(compra, entradasVinculadas)` de
 * `data-model.md` — único ponto de decisão da precedência de 3 vias
 * (Edge Case, FR-051): nenhum repositório deve reimplementar esta
 * ordem por conta própria.
 *
 * 1. Soma de EntradaAvulsa vinculadas, se houver ao menos uma —
 *    **sempre vence**, mesmo com um valor manual também definido
 *    (delegado a `installments.recomputeSplitOnRefund`).
 * 2. `valorResponsabilidade` manual, se definido.
 * 3. `valorTotalOriginal` (padrão, FR-049).
 */
export function resolveResponsibility(
  compra: CompraForResponsibility,
  entradasVinculadas: { valor: number }[],
): number {
  if (entradasVinculadas.length > 0) {
    return recomputeSplitOnRefund(compra, entradasVinculadas);
  }
  if (compra.valorResponsabilidade !== null) {
    return compra.valorResponsabilidade;
  }
  return compra.valorTotalOriginal;
}
