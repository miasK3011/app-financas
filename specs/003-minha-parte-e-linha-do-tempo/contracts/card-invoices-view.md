# Contrato: faturas do cartão (US3)

## `domain/invoices/invoiceYearView.ts`
Funções puras sobre `InvoiceWithTotals[]` (já com `status` calculado por `withTotals` +
`demoteFutureOpenInvoices`):
- `availableYears(invoices): number[]` — anos de `referenciaAno` (o ano do rótulo da linha), distintos, asc.
- `sortInvoicesForList(invoices)` — ordenação que antes vivia na tela.
- `initialYear(years, today): number | undefined`.
- `filterInvoicesForYear(invoices, year, showPaid): InvoiceWithTotals[]` — exclui `status === 'PAGA'`
  quando `!showPaid`.
- `countPaidInYear(invoices, year): number`.

## UI — `cartao/[cardId]/index.tsx`
- Sem o título "Faturas". Logo abaixo do card do cartão: `MonthNavigator` com
  `label={String(year)}`, setas andando entre anos com faturas e desabilitadas nos extremos; oculto se
  não há faturas.
- Botão largo no fim da lista: `Mostrar pagas (n)` / `Ocultar pagas` (oculto quando `n = 0` ou quando
  o estado vazio já oferece o atalho).
- Textos: "Sua parte: R$ X" (fatura aberta dividida) e "Prevista" (fatura futura).
- Ordenação dentro do ano: a atual (`index.tsx:42-49`) aplicada ao subconjunto filtrado.
- Estado vazio: "Nenhuma fatura em aberto em {ano}" + (se `n > 0`) "{n} paga(s) oculta(s)".

## Detalhe — `cartao/[cardId]/fatura/[invoiceId].tsx`
- `listPurchasesForInvoice`: `ORDER BY compras.dataCompra DESC, compras.criadoEm DESC`.
- Sem o título "Compras desta fatura". Lista agrupada com
  `groupByDay(rows, r => r.compra.dataCompra, today)` + `DayGroupHeader`;
  conteúdo de cada linha inalterado (avatar, pill de parcela, tags, "Sua parte").
