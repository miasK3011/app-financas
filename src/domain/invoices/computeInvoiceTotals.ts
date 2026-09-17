export type InvoiceTotalsInput = {
  valor: number;
  valorResponsabilidade: number;
};

/**
 * FR-011: o total de uma fatura é SEMPRE a soma das parcelas nela
 * alocadas — nunca uma coluna própria que possa divergir. FR-053:
 * `totalResponsabilidade` só deve ser exibido na UI quando diferente
 * de `total` (ver `shouldShowResponsibilitySummary`, User Story 12).
 */
export function computeInvoiceTotals(parcelas: InvoiceTotalsInput[]): {
  total: number;
  totalResponsabilidade: number;
} {
  return parcelas.reduce(
    (acc, parcela) => ({
      total: acc.total + parcela.valor,
      totalResponsabilidade: acc.totalResponsabilidade + parcela.valorResponsabilidade,
    }),
    { total: 0, totalResponsabilidade: 0 },
  );
}
