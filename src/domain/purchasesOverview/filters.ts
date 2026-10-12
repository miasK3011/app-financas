import type { FormaPagamento, PurchaseListRow } from './types';

/** Filtros da linha do tempo de Compras (FR-008 da feature 003). */
export type PurchaseFilters = {
  formaPagamento: 'TODOS' | FormaPagamento;
  /** Oculta qualquer compra dividida (`isSplit`), inclusive com parte 0. */
  soMinhas: boolean;
};

export function applyPurchaseFilters(
  rows: PurchaseListRow[],
  filters: PurchaseFilters,
): PurchaseListRow[] {
  return rows.filter(
    (row) =>
      (filters.formaPagamento === 'TODOS' || row.formaPagamento === filters.formaPagamento) &&
      (!filters.soMinhas || !row.isSplit),
  );
}

export const NO_FILTERS: PurchaseFilters = { formaPagamento: 'TODOS', soMinhas: false };

/** O chip "Todos" significa "nenhum filtro": só fica ativo quando nada mais está. */
export function isUnfiltered(filters: PurchaseFilters): boolean {
  return filters.formaPagamento === 'TODOS' && !filters.soMinhas;
}

/** Cartão/Pix são exclusivos entre si; tocar no chip já ativo volta para "Todos". */
export function toggleFormaPagamento(
  filters: PurchaseFilters,
  formaPagamento: FormaPagamento,
): PurchaseFilters {
  return {
    ...filters,
    formaPagamento: filters.formaPagamento === formaPagamento ? 'TODOS' : formaPagamento,
  };
}

/** "Só minhas" combina com Cartão/Pix. */
export function toggleSoMinhas(filters: PurchaseFilters): PurchaseFilters {
  return { ...filters, soMinhas: !filters.soMinhas };
}
