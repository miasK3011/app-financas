# Contrato: linha do tempo de Compras (US2) — substitui a decisão-chave de `002/contracts/purchases-overview.md`

## Decisão-chave (substitui a da 002)
A unidade de listagem dos meses atual/passados passa a ser a **Compra**, atribuída ao mês pela
`compras.dataCompra` (cartão e Pix). O total de Compras **não** precisa mais bater com o "Gastos"
da Início: Início = o que vence no mês (fluxo de caixa); Compras = o que foi comprado no mês
(research R1). A visão de previsão de meses futuros (`listForecastInvoicesForMonth`) permanece por
Parcela/Fatura, com tipo `ForecastRow`.

## `purchasesRepository.listPurchasesForMonth(year, month): Promise<PurchaseListRow[]>`
- Uma query: `compras` `LEFT JOIN cartoes` `LEFT JOIN categorias` `INNER JOIN parcelas`, onde
  `compras.dataCompra` ∈ mês, `GROUP BY compras.id`, `sum(parcelas.valorResponsabilidade)` como
  `valorResponsabilidade`.
- Mapeamento → `PurchaseListRow` (data-model): `valor = valorTotalOriginal`; `isSplit =
  valorResponsabilidade < valor`; `parcelas = parcelasTotal > 1 ? { atual: parcelaAtual, total:
  parcelasTotal } : null`; `nomeCartao` só para cartão.
- `ORDER BY compras.dataCompra DESC, compras.criadoEm DESC`.

## `domain/purchasesOverview`
- `groupByDay<T>(rows: T[], getDate: (r: T) => Date, today: Date): DayGroup<T>[]` — ordena cópia
  desc por `getDate`, agrupa por dia calendário, rótulos "Hoje"/"Ontem"/"d 'de' MMMM" (ptBR).
- `applyPurchaseFilters(rows, { formaPagamento, soMinhas })`.
- `computeBreakdown(rows)` → `{ total, totalResponsabilidade, porFormaPagamento }` (rows já filtradas).
- `monthRange`: inalterado (earliest = compra mais antiga; latest = max(hoje, maior vencimento)).

## UI — `(tabs)/compras/index.tsx`
- Chips Todos/Cartão/Pix/**"Só minhas"** via `FilterChip` (com `pressStyle`). Estado puro em
  `filters.ts`: `NO_FILTERS`, `isUnfiltered` (Todos ativo), `toggleFormaPagamento` (exclusivo,
  tocar de novo volta a Todos), `toggleSoMinhas`. Ocultos no modo previsão.
- Lista e card usam `useDeferredValue(filters)` + `useMemo` (lista memoizada); enquanto o valor
  adiado está defasado, lista/card ficam esmaecidos (FR-008a).
- Card de gasto: total grande (filtrado) + "Sua parte: R$ X" 13px quando
  `totalResponsabilidade !== total`. Barra/legenda Cartão/Pix também sobre as linhas filtradas.
- Linha: selo "Nx" (ou "k/N" quando `parcelas.atual > 1`, ver research R9); ícone de divisão
  (`Users`) + subtítulo "Sua parte: R$ X" quando `isSplit`, como em `fatura/[invoiceId].tsx`.
- Cabeçalhos de dia via `components/DayGroupHeader.tsx`. Linhas planas com divisória.
- Estado vazio com filtros ativos: "Nenhuma compra com esses filtros em {mês}".
