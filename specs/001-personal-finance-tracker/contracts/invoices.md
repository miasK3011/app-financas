# Contrato: `domain/invoices`

Não há API remota neste projeto (Princípio I) — este documento é o contrato **interno** entre o
módulo de domínio `src/domain/invoices/` e quem o consome (`repositories/`, `hooks/`).

## `resolveInvoicePeriod(cardClosingDay: number, purchaseDate: Date): { year: number; month: number }`

Determina em qual mês de referência de fatura uma data cai, para um cartão com determinado dia de
fechamento.

- Regra (FR-002, Edge Case): se `purchaseDate.day ≤ cardClosingDay` (ajustado ao último dia válido
  do mês via clamp — Edge Case de dia 31/30/29), a compra cai no ciclo que fecha **naquele mesmo
  mês**; caso contrário, cai no ciclo do mês seguinte.
- Uma compra no dia exato do fechamento entra no ciclo que fecha nesse dia (cenário 2 da User Story 1).

## `computeInvoiceDates(card: { diaFechamento; diaVencimento }, year: number, month: number): { dataFechamento: Date; dataVencimento: Date }`

**Correção de implementação (2026-09-17)**: a versão original deste contrato descrevia um único
`ensureInvoice(cardId, year, month): Fatura` fazendo tanto o cálculo de datas quanto o upsert no
banco — isso violaria a separação `domain/` (puro) vs. `repositories/` (única camada com acesso a
Drizzle) do `plan.md`. Dividido em dois:

- `computeInvoiceDates` (aqui, em `domain/invoices/`) é puro: calcula `dataFechamento` (clamp de
  `diaFechamento` no mês de referência) e `dataVencimento` — regra decidida na implementação (não
  explicitada em `data-model.md`): quando `diaVencimento ≥ diaFechamento`, o vencimento cai no
  MESMO mês do fechamento (ex.: fecha dia 10, vence dia 17 — caso da User Story 1); quando
  `diaVencimento < diaFechamento`, cai no mês SEGUINTE (padrão comum de cartão real: fecha perto do
  fim do mês, vence no início do mês seguinte).
- `repositories/invoicesRepository.getOrCreateInvoice(cardId, year, month): Fatura` (upsert
  idempotente por `(cardId, year, month)`) é quem de fato lê/insere no banco, chamando
  `computeInvoiceDates` apenas quando precisa criar uma Fatura nova. Usado por `installments` (ao
  gerar parcelas futuras) e por `subscriptions` (ao gerar cobrança mensal).

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
