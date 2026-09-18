/** FR-053: controla a linha "Você paga: R$ X" em Fatura · Detalhe e Cartão · Faturas. */
export function shouldShowResponsibilitySummary(fatura: {
  total: number;
  totalResponsabilidade: number;
}): boolean {
  return fatura.total !== fatura.totalResponsabilidade;
}
