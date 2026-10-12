# Contrato: faturas do cartão (US3)

## `domain/invoices/invoiceYearView.ts`
Funções puras sobre `InvoiceWithTotals[]` (já com `status` calculado por `withTotals` +
`demoteFutureOpenInvoices`):
- `availableYears(invoices): number[]` — anos de `dataVencimento`, distintos, asc.
- `initialYear(years, today): number | undefined`.
- `filterInvoicesForYear(invoices, year, showPaid): InvoiceWithTotals[]` — exclui `status === 'PAGA'`
  quando `!showPaid`.
- `countPaidInYear(invoices, year): number`.

## UI — `cartao/[cardId]/index.tsx`
- Abaixo do resumo do cartão: `MonthNavigator` com `label={String(year)}`,
  `prevDisabled = year === min(years)`, `nextDisabled = year === max(years)`; oculto se não há faturas.
- Cabeçalho "Faturas" ganha, à direita, botão de texto: `Mostrar pagas (n)` / `Ocultar pagas`
  (oculto quando `n = 0`).
- Ordenação dentro do ano: a atual (`index.tsx:42-49`) aplicada ao subconjunto filtrado.
- Estado vazio: "Nenhuma fatura em aberto em {ano}" + (se `n > 0`) "{n} paga(s) oculta(s)".

## Detalhe — `cartao/[cardId]/fatura/[invoiceId].tsx`
- `listPurchasesForInvoice`: `ORDER BY compras.dataCompra DESC, compras.criadoEm DESC`.
- Lista agrupada com `groupByDay(rows, r => r.compra.dataCompra, today)` + `DayGroupHeader`;
  conteúdo de cada linha inalterado (avatar, pill de parcela, tags, "Sua parte").
