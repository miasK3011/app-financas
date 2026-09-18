import type { ParcelaComCompra } from './types';

/** FR-044: as `limit` compras (parcelas) de maior `valorResponsabilidade`. */
export function topExpenses(parcelas: ParcelaComCompra[], limit: number): ParcelaComCompra[] {
  return [...parcelas]
    .sort((a, b) => b.valorResponsabilidade - a.valorResponsabilidade)
    .slice(0, limit);
}
