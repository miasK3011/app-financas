# Contrato: `domain/invoices`

Não há API remota neste projeto (Princípio I) — este documento é o contrato **interno** entre o
módulo de domínio `app/domain/invoices/` e quem o consome (`repositories/`, `hooks/`).

## `resolveInvoicePeriod(cardClosingDay: number, purchaseDate: Date): { year: number; month: number }`

Determina em qual mês de referência de fatura uma data cai, para um cartão com determinado dia de
fechamento.

- Regra (FR-002, Edge Case): se `purchaseDate.day ≤ cardClosingDay` (ajustado ao último dia válido
  do mês via clamp — Edge Case de dia 31/30/29), a compra cai no ciclo que fecha **naquele mesmo
  mês**; caso contrário, cai no ciclo do mês seguinte.
- Uma compra no dia exato do fechamento entra no ciclo que fecha nesse dia (cenário 2 da User Story 1).

## `ensureInvoice(cardId: string, year: number, month: number): Fatura`

Upsert idempotente (chave `(cardId, year, month)`) — cria a Fatura com `dataFechamento`/
`dataVencimento` derivadas do Cartão se ainda não existir, ou retorna a existente. Usado por
`installments` (ao gerar parcelas futuras) e por `subscriptions` (ao gerar cobrança mensal).

## `computeInvoiceStatus(fatura: Fatura, today: Date): 'ABERTA' | 'FECHADA' | 'PAGA'`

- `PAGA` se `fatura.pagaEm` não é nulo.
- `FECHADA` se `today > fatura.dataFechamento`.
- `ABERTA` caso contrário.

Não persiste nada — é usado para exibição; a transição para `PAGA` só acontece via ação explícita
do usuário (repositório grava `pagaEm`).

## `computeInvoiceTotals(parcelas: Parcela[]): { total: number; totalResponsabilidade: number }`

Soma `Parcela.valor` e `Parcela.valorResponsabilidade` de todas as Parcelas de uma Fatura
(FR-011, FR-053). `totalResponsabilidade` só deve ser exibido na UI quando
`totalResponsabilidade !== total` (FR-053 — "sempre que houver ao menos uma compra com
responsabilidade diferente do valor total").
