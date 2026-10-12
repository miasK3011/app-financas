# Contrato: base de gasto (US1) — `domain/statistics`, `statisticsRepository`, `useMonthBalance`

Contrato interno (sem API remota — Princípio I).

## `domain/statistics`
- `amountOf(p: ParcelaComCompra, basis: SpendingBasis): number` → `basis === 'global' ? p.valor : p.valorResponsabilidade`.
- `totalSpent(parcelas, basis = 'minha')`
- `spendingByCategory(parcelas, basis = 'minha')`
- `topExpenses(parcelas, limit, basis = 'minha')` — ordena por `amountOf`.
- `subscriptionsShare(parcelas, total, basis = 'minha')`
- `compareToPrevious` / `idealSpendComparison`: inalterados (recebem números).

Default `'minha'` preserva comportamento e testes existentes (inclusive o bloco US12/FR-054).

## `repositories/statisticsRepository`
- `toParcelaComCompra` passa a mapear `valor: parcela.valor`.
- `getStatistics(kind, anchor = new Date(), basis: SpendingBasis = 'minha'): Promise<StatisticsResult>`:
  - `totalSpent`, `comparison`, `spendingByCategory`, `topExpenses`, `subscriptionsShare` usam `basis`
    (período anterior também, para a comparação ser da mesma base).
  - `totalMinhaParte = totalSpent(current, 'minha')`.
  - `idealSpend = idealSpendComparison(totalMinhaParte, …)` — sempre pela parte (FR-005).
- `getMonthlySpendingHistory`: inalterado (pela parte).

## `hooks/useStatistics(kind, basis = 'minha', anchor?: Date)`
Recarrega ao mudar `kind`, `basis` ou `anchor` e a cada foco (`useFocusEffect`). `anchor` é usado pela tela de detalhamento (US4).

## `hooks/useMonthBalance` (saldo — FR-001/FR-002)
- `listPixPurchasesForMonth(year, month)` → `PixPurchaseWithShare[]` = `Array<Purchase & { parteUsuario: number }>`
  onde `parteUsuario = Σ parcelas.valorResponsabilidade` da compra (JOIN + `sum` agrupado por
  compra) — nome distinto de `compras.valorResponsabilidade` (manual, nullable).
- `entradasAvulsas` = `cashEntries.filter(e => !e.compraVinculadaId).map(e => e.valor)` (FR-001a —
  reembolso vinculado já reduziu a parte; não somar de novo). A lista `entries` retornada pelo hook
  continua completa.
- `comprasPix` = `pix.map(p => p.parteUsuario)`; `faturasVencendo` = `invoices.map(i => i.totalResponsabilidade)`;
  `expenses` = soma das duas.
- `computeMonthBalance`: assinatura inalterada.

## Preferências de sessão — `src/state/statisticsPrefs.ts` (novo)
Variável de módulo (sem persistência) `basis` com getter/setter, lidas como
valor inicial do `useState` das telas — sobrevivem ao desmonte da tela enquanto o app está aberto.

## UI — `estatisticas.tsx`
- Estado inicial de `basis` lido de `statisticsPrefs`; cada troca grava de volta.
- `SegmentedControl<SpendingBasis>` com `[{value:'minha',label:'Meu gasto'},{value:'global',label:'Global'}]`
  logo abaixo do seletor de período; estado mantido ao trocar o período.
- Card de total: quando `basis === 'global' && totalMinhaParte !== totalSpent` → linha secundária
  "Sua parte: R$ X" (padrão visual de `fatura/[invoiceId].tsx`, 13px, `$textSecondary`).
- Corrigir mutação in-place: ordenar uma cópia de `spendingByCategory`.
