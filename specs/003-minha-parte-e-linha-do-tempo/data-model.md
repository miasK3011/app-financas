# Data Model: Feature 003

**Nenhuma mudança de schema/migration.** Todas as estruturas abaixo são tipos derivados em memória,
recalculados a partir de `compras`, `parcelas` e `faturas` existentes. Valores monetários são
inteiros em centavos (como no restante do app).

## Entidades persistidas usadas (sem alteração)

| Entidade | Campos relevantes |
|---|---|
| `compras` | `id`, `descricao`, `valorTotalOriginal`, `dataCompra`, `formaPagamento`, `cartaoId`, `parcelasTotal`, `parcelaAtual`, `categoriaId`, `valorResponsabilidade` (manual, nullable), `origem`, `criadoEm` |
| `parcelas` | `id`, `compraId`, `faturaId` (null = Pix), `numero`, `valor`, `valorResponsabilidade` (NOT NULL — parte efetiva já resolvida) |
| `faturas` | `id`, `cartaoId`, `dataVencimento`, `pagaEm`; exposta como `InvoiceWithTotals { total, totalResponsabilidade, status }` |

## Tipos derivados novos/alterados

### `SpendingBasis` (novo — `domain/statistics/types.ts`)
`'minha' | 'global'`. `'minha'` → `parcela.valorResponsabilidade`; `'global'` → `parcela.valor`.

### `ParcelaComCompra` (alterado)
\+ `valor: number` (valor cheio da parcela). Demais campos inalterados.

### `StatisticsResult` (alterado — `statisticsRepository.ts`)
\+ `basis: SpendingBasis`; \+ `totalMinhaParte: number` (sempre pela parte; usado como subtítulo
quando `basis = 'global'` e `totalMinhaParte !== totalSpent`). `idealSpend` sempre pela parte.

### `CategoryShare` (novo — `domain/statistics/categoryShare.ts`)
```ts
type CategoryShare = { key: string /* categoriaId | 'outras' | 'sem-categoria' */;
  categoriaId: string | null; total: number; pct: number /* 0..100 */; isOutras: boolean };
```
Regras: ordena `spendingByCategory` desc por `total`; ignora totais ≤ 0; mantém os 5 primeiros e
soma o resto em um único `isOutras` (só se houver ≥ 1 restante); `pct` arredondado a 1 casa com o
último item ajustado para a soma dar exatamente 100. `toCategoryShare(list, topN = 5)` e
`toCategoryShareFull(list)` (sem agrupamento, para a tela de detalhamento).

### `PurchaseListRow` (alterado — `domain/purchasesOverview/types.ts`)
Unidade passa a ser a **Compra** (research R1).
```ts
type PurchaseListRow = {
  compraId: string; descricao: string; categoria: {icone; nome} | null;
  valor: number;                    // compra.valorTotalOriginal
  valorResponsabilidade: number;    // Σ parcelas.valorResponsabilidade da compra
  isSplit: boolean;                 // valorResponsabilidade < valor
  formaPagamento: 'CARTAO' | 'PIX'; nomeCartao: string | null;
  parcelas: { atual: number; total: number } | null; // null quando parcelasTotal = 1
  dataCompra: Date;                 // SEMPRE a data real da compra
};
```
`parcelaId` sai da linha da linha do tempo; a visão de previsão (`InvoiceGroup`) continua usando
uma variante por parcela — `ForecastRow` (= shape antigo, renomeado) para não misturar semânticas.

### `PaymentBreakdown` (alterado)
\+ `totalResponsabilidade: number`. Calculado sobre as linhas **já filtradas** (FR-009).

### `PurchaseFilters` (novo — `domain/purchasesOverview/filters.ts`)
`{ formaPagamento: 'TODOS' | 'CARTAO' | 'PIX'; soMinhas: boolean }` →
`applyPurchaseFilters(rows, filters)`; `soMinhas` remove `isSplit = true`.

### `DayGroup<T>` (generalizado)
`{ label: string; date: Date; rows: T[] }`, produzido por `groupByDay(rows, getDate, today)` —
ordena desc por `getDate` antes de agrupar; rótulos "Hoje"/"Ontem"/"d 'de' MMMM".

### `InvoiceYearView` (novo — `domain/invoices/invoiceYearView.ts`)
- `availableYears(invoices): number[]` — anos distintos de `dataVencimento`, asc.
- `initialYear(years, today): number | undefined` — ano corrente se presente, senão o mais próximo.
- `filterInvoicesForYear(invoices, year, showPaid): Invoice[]` — mantém a ordenação atual da tela.
- `countPaidInYear(invoices, year): number`.
Fatura `FUTURA` pertence ao ano do seu `dataVencimento`.

### `PixPurchaseWithShare` (novo — retorno de `listPixPurchasesForMonth`)
`Purchase & { parteUsuario: number }` — `parteUsuario = Σ parcelas.valorResponsabilidade` da compra.
Nome distinto de `compras.valorResponsabilidade` (manual, nullable) para evitar ambiguidade.

### Regra do saldo (FR-001/FR-001a)
`saldo = renda + Σ entradas avulsas SEM compraVinculadaId − Σ parteUsuario (Pix) − Σ totalResponsabilidade (faturas que vencem)`.

## Estado de UI (sessão, não persistido)

| Tela | Estado | Padrão |
|---|---|---|
| Estatísticas | `basis` (em `src/state/statisticsPrefs.ts`, sobrevive ao desmonte) | `'minha'` |
| Estatísticas | `categoryView: 'lista' \| 'grafico'` (idem) | `'lista'` |
| Compras | `filters.soMinhas` | `false` |
| Cartão | `year`, `showPaid` | `initialYear(...)`, `false` |
