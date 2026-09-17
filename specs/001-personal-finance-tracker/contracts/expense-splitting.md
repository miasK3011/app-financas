# Contrato: `domain/expenseSplitting`

Cobre inteiramente a User Story 12 (FR-046 a FR-055). A função central
(`responsabilidadeEfetiva`) já está documentada em `data-model.md` e reexportada por
`domain/installments.recomputeSplitOnRefund`; este contrato cobre o restante da regra de negócio.

## `validateManualResponsibility(valorResponsabilidade: number, valorTotalOriginal: number): void`

Lança `InvalidResponsibilityError` se `valorResponsabilidade < 0` ou
`valorResponsabilidade > valorTotalOriginal` (FR-048). Chamado pelo schema `zod` do formulário de
Nova Compra / Editar Compra antes de salvar.

## `requiresMotivoResponsavelFields(valorResponsabilidade: number | null, valorTotalOriginal: number): boolean`

Retorna `true` quando `valorResponsabilidade` está definido manualmente e é diferente de
`valorTotalOriginal` — controla se os campos opcionais "motivo" e "responsável" aparecem no
formulário (FR-047). Quando `false`, a UI ainda permite preenchê-los como opcionais, mas não os
exige nem destaca.

## `shouldShowResponsibilitySummary(fatura: { total: number; totalResponsabilidade: number }): boolean`

`fatura.total !== fatura.totalResponsabilidade` — controla a exibição da linha "Você paga: R$ X"
em `Fatura · Detalhe` e `Cartão · Faturas` (FR-053, refletido no design como o rótulo "Você paga").

## Precedência (Edge Case, reforçado aqui por ser a regra mais fácil de implementar errado)

Ordem de prioridade ao calcular a responsabilidade efetiva de uma Compra:

1. Soma de `EntradaAvulsa` vinculadas (se houver ao menos uma) — **sempre vence**, mesmo se um
   `valorResponsabilidade` manual também estiver setado.
2. `valorResponsabilidade` manual, se definido e não houver nenhuma entrada vinculada.
3. `valorTotalOriginal` (comportamento padrão, sem nenhuma divisão registrada — FR-049).

Sempre que o conjunto de entradas vinculadas de uma Compra muda (criação, edição de valor, exclusão
ou desvinculação de uma `EntradaAvulsa.compraVinculadaId`), o repositório deve reexecutar esta
precedência e, se o resultado mudou, propagar para `Parcela.valorResponsabilidade` via
`installments.recomputeSplitOnRefund` + `splitInstallments`.
