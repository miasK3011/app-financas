/**
 * FR-041 (Edge Case): `null` quando não há dado do período anterior
 * para comparar (repositório passa `null` nesse caso) — ou quando o
 * total anterior é exatamente zero, já que uma variação percentual a
 * partir de uma base zero não é matematicamente significativa. A UI
 * mostra "sem dado para comparar" em vez de uma variação incorreta.
 */
export function compareToPrevious(
  currentTotal: number,
  previousTotal: number | null,
): { percent: number } | null {
  if (previousTotal === null || previousTotal === 0) return null;
  return { percent: (currentTotal - previousTotal) / previousTotal };
}
