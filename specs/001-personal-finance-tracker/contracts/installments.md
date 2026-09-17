# Contrato: `domain/installments`

## `splitInstallments(input: { valorTotalOriginal: number; parcelasTotal: number; parcelaAtual: number; valorResponsabilidade: number | null }): InstallmentPlan[]`

`InstallmentPlan = { numero: number; valor: number; valorResponsabilidade: number }`

- Valida primeiro (lança `InvalidInstallmentError` se falhar — mapeado para mensagem de FR-005):
  `1 ≤ parcelaAtual ≤ parcelasTotal`.
- `valorBase = Math.floor(valorTotalOriginal / parcelasTotal)`; a diferença de arredondamento
  (`valorTotalOriginal - valorBase * parcelasTotal`) é somada inteiramente à primeira parcela do
  array retornado (a parcela `parcelaAtual` — Assumption "diferença de arredondamento absorvida
  pela primeira parcela gerada").
- Gera uma entrada para cada `numero` de `parcelaAtual` até `parcelasTotal` (inclusive) — nunca
  gera números menores que `parcelaAtual` (compras já em andamento, FR-006).
- `responsabilidadeEfetiva = valorResponsabilidade ?? valorTotalOriginal` (ver `data-model.md`);
  `valorResponsabilidade` de cada parcela = `Math.round(parcela.valor * responsabilidadeEfetiva /
  valorTotalOriginal)` — mesma proporção em todas as parcelas (FR-055).

## `allocateInstallmentsToInvoices(plan: InstallmentPlan[], card: Cartão, purchaseDate: Date): { numero: number; year: number; month: number }[]`

- A primeira entrada do `plan` (a `parcelaAtual`) vai para o mês retornado por
  `invoices.resolveInvoicePeriod(card.diaFechamento, purchaseDate)`.
- Cada entrada seguinte vai para o mês seguinte consecutivo (não pula meses).
- Para cada `(year, month)` retornado, o chamador (repositório) deve chamar
  `invoicesRepository.getOrCreateInvoice(card.id, year, month)` antes de persistir a Parcela
  correspondente (nome corrigido — ver `contracts/invoices.md`, Correção de implementação).

## `recomputeSplitOnRefund(compra: { valorTotalOriginal: number }, entradasVinculadas: { valor: number }[]): number`

Implementa a função `responsabilidadeEfetiva` de `data-model.md` para o caso com entradas
vinculadas: `Math.max(0, compra.valorTotalOriginal - sum(entradasVinculadas.map(e => e.valor)))`.
Chamado sempre que uma Entrada Avulsa é criada, editada ou desvinculada de uma Compra (FR-051, Edge
Cases de desvinculação e múltiplas entradas). Quando o resultado muda, o repositório deve
re-executar `splitInstallments`/`allocateInstallmentsToInvoices` apenas para atualizar
`Parcela.valorResponsabilidade` de todas as parcelas já existentes daquela Compra — nunca move
parcelas de fatura nem altera `Parcela.valor`.
