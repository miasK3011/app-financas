# Contrato: `domain/statistics`

Entrada de todas as funções abaixo é sempre um conjunto de `Parcela` (com sua `Compra` associada
já resolvida/joined pelo repositório) filtrado por um `period: { start: Date; end: Date }` — o
módulo de domínio nunca consulta o banco diretamente.

## `resolvePeriod(kind: 'DIARIO' | 'SEMANAL' | 'MENSAL' | 'ANUAL', anchor: Date): { current: Period; previous: Period }`

Deriva o período corrente e o período equivalente imediatamente anterior a partir de uma data-âncora
(hoje, por padrão) e do tipo de período selecionado (FR-039). Ex.: `MENSAL` com âncora em
Outubro/2026 → `current = 01–31/out/2026`, `previous = 01–30/set/2026`.

## `totalSpent(parcelas: ParcelaComCompra[]): number`

Soma `responsabilidadeEfetiva` (não `valor`!) de cada Parcela no período — FR-040 e FR-054 exigem
que Estatísticas reflita o gasto pessoal real, não o total da fatura.

## `compareToPrevious(currentTotal: number, previousTotal: number | null): { percent: number } | null`

Retorna `null` quando `previousTotal` é `null` ou não há nenhuma parcela no período anterior — a UI
exibe "sem dado para comparar" em vez de uma variação incorreta (FR-041, Edge Case). Caso contrário,
`percent = (currentTotal - previousTotal) / previousTotal`.

## `spendingByCategory(parcelas: ParcelaComCompra[]): { categoriaId: string | null; total: number }[]`

Agrupa por `Compra.categoriaId` somando `responsabilidadeEfetiva` (FR-043).

## `topExpenses(parcelas: ParcelaComCompra[], limit: number): ParcelaComCompra[]`

Ordena por `responsabilidadeEfetiva` descendente (FR-044).

## `subscriptionsShare(parcelas: ParcelaComCompra[], totalSpent: number): { subscriptionsTotal: number; percent: number }`

`subscriptionsTotal` = soma de `responsabilidadeEfetiva` das parcelas cuja `Compra.origem ===
'ASSINATURA'`; `percent = subscriptionsTotal / totalSpent` (FR-045; base é o gasto do próprio
período, não a renda — Assumption).

## `idealSpendComparison(totalSpent: number, income: number | null, goalPercent: number | null): { used: number; goalAmount: number } | null`

Retorna `null` se `income` ou `goalPercent` forem `null` (nenhuma Meta configurada ou nenhuma Renda
configurada — FR-042, Edge Case). Caso contrário, `goalAmount = income * goalPercent`,
`used = totalSpent / goalAmount`.
