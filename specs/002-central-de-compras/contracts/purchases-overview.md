# Contrato: `domain/purchasesOverview` + `repositories/purchasesRepository` (extensão)

Não há API remota neste projeto (Princípio I) — este documento é o contrato **interno** entre o
módulo de domínio novo `src/domain/purchasesOverview/`, a extensão de
`src/repositories/purchasesRepository.ts`, e a tela `(tabs)/compras/index.tsx`.

## Decisão-chave: reaproveitar a atribuição de mês já usada pelas Estatísticas

`domain/statistics` (feature 001, `contracts/statistics.md` implícito em
`statisticsRepository.listParcelasForPeriod`) já resolve exatamente o problema de "a quantas
transações mistas (cartão + Pix) pertence um mês": uma Parcela Pix conta pelo mês da
`Compra.dataCompra` (não tem Fatura); uma Parcela de cartão conta pelo mês da
`Fatura.dataVencimento` da fatura a que pertence. Esta é a MESMA regra que já alimenta o "Gastos"
exibido na tela Início.

A tela Compras **reutiliza exatamente essa regra**, em vez de introduzir uma segunda noção de "mês
de uma transação" — senão o total exibido em Compras poderia divergir do "Gastos" já mostrado na
Início para o mesmo mês, o que seria uma inconsistência visível para o usuário. Consequência
direta: **a unidade de listagem da tela Compras é a Parcela, não a Compra** — uma compra parcelada
em 4x aparece uma vez por mês (uma linha por parcela), não uma única vez no mês da compra original
(diferente de `listRecentPurchases`, que é por Compra — usada só na Início, não reaproveitada aqui).

Isso também define o "dia" usado no agrupamento por dia (FR-010): para uma parcela Pix, o dia é
`Compra.dataCompra`; para uma parcela de cartão, o dia é `Fatura.dataVencimento` — então todas as
parcelas que caem na mesma fatura aparecem sob o mesmo dia (o dia de vencimento daquela fatura).

## `repositories/purchasesRepository.listPurchasesForMonth(year: number, month: number): Promise<PurchaseListRow[]>`

- Constrói o `Period` do mês com `resolvePeriod('MENSAL', new Date(year, month - 1, 15)).current`
  (mesma função já usada por `domain/statistics/resolvePeriod` — dia 15 como âncora arbitrária
  dentro do mês, sem efeito colateral).
- Query em duas partes, no mesmo padrão de `listParcelasForPeriod` (mas selecionando as colunas
  extras que a UI precisa, que `ParcelaComCompra` não carrega):
  - Pix: `parcelas` `INNER JOIN compras` onde `parcelas.faturaId IS NULL` e
    `compras.dataCompra` dentro do período.
  - Cartão: `parcelas` `INNER JOIN compras` `INNER JOIN faturas` `INNER JOIN cartoes` onde
    `faturas.dataVencimento` dentro do período.
  - Ambas com `LEFT JOIN categorias` (mesmo padrão de `listPurchasesForInvoice`).
- Mapeia cada linha para `PurchaseListRow` (`data-model.md`): `dataCompra` do campo acima descrito
  ("dia"); `parcela` presente apenas quando `compra.parcelasTotal > 1`; `nomeCartao` só quando
  `formaPagamento = 'CARTAO'`.
- Ordenação: mais recente primeiro (mesmo sentido de `listRecentPurchases`).

## `repositories/purchasesRepository.listForecastInvoicesForMonth(year: number, month: number): Promise<{ cartaoNome: string; dataVencimento: Date; rows: PurchaseListRow[] }[]>`

Usado apenas quando `MonthOverview.kind = 'futuro-previsto'` (FR-013). Reaproveita
`invoicesRepository.listInvoicesDueInMonth(year, month)` para achar as faturas do mês, e
`purchasesRepository.listPurchasesForInvoice(invoiceId)` (já existente) para as linhas de cada uma
— convertendo `InvoicePurchaseRow` para `PurchaseListRow` (mesmo shape usado na visão por dia, para
o componente de lista ser um só).

## `domain/purchasesOverview/monthRange.ts` — `computeMonthRange(earliestCompraDate: Date | null, invoiceDueDatesWithParcela: Date[], today: Date): MonthRange`

Puro — recebe já resolvido do banco (repositório busca `MIN(compras.dataCompra)` e a lista de
`Fatura.dataVencimento` que têm ao menos uma Parcela). `earliest` = mês de `earliestCompraDate`
(`undefined` se `null`, ver Edge Case de estado vazio). `latest` = o maior entre o mês de `today` e o
mês de `max(invoiceDueDatesWithParcela)` (`today` quando a lista estiver vazia — FR-009, seta de
avançar desabilitada já no mês corrente).

## `domain/purchasesOverview/groupByDay.ts` — `groupByDay(rows: PurchaseListRow[], today: Date): { label: string; rows: PurchaseListRow[] }[]`

Puro. Agrupa por `dataCompra` (dia calendário, sem hora). `label`: `"Hoje"` quando `isToday`,
`"Ontem"` quando `isYesterday` (`date-fns`), senão `"{d} de {mês por extenso}"` (ex.: "17 de
setembro"). Grupos ordenados do mais recente para o mais antigo, mesma ordem das linhas dentro de
cada grupo.

## `domain/purchasesOverview/paymentBreakdown.ts` — `computeBreakdown(rows: PurchaseListRow[]): PaymentBreakdown`

Puro. Soma `valor` de todas as `rows` (`total`) e agrupa a soma por `formaPagamento`, omitindo do
array qualquer forma de pagamento com soma zero (FR-010 — a barra/legenda só mostra o que existe
naquele mês).
