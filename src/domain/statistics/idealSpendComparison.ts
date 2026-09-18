/**
 * FR-042 (Edge Case): `null` quando não há Renda vigente **ou** Meta
 * de Consumo Ideal configuradas — a seção correspondente não aparece
 * na UI. `goalPercent` é uma fração (`0.7` = 70% da renda).
 */
export function idealSpendComparison(
  totalSpentValue: number,
  income: number | null,
  goalPercent: number | null,
): { used: number; goalAmount: number } | null {
  if (income === null || goalPercent === null) return null;

  const goalAmount = income * goalPercent;
  const used = goalAmount === 0 ? 0 : totalSpentValue / goalAmount;
  return { used, goalAmount };
}
