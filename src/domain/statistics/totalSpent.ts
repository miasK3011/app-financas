import type { ParcelaComCompra } from './types';

/** FR-040/FR-054: soma `valorResponsabilidade` — nunca `valor` — o gasto pessoal real. */
export function totalSpent(parcelas: ParcelaComCompra[]): number {
  return parcelas.reduce((sum, parcela) => sum + parcela.valorResponsabilidade, 0);
}
