# Phase 1 Data Model: Central de Compras e Navegação Simplificada

Esta feature não cria nem altera nenhuma tabela do banco local — é somente leitura/agregação sobre
as entidades já formalizadas em
[`specs/001-personal-finance-tracker/data-model.md`](../001-personal-finance-tracker/data-model.md):
`Compra`, `Fatura`, `Cartão`. Este documento formaliza apenas os **tipos derivados** (nunca
persistidos) que a tela Compras e o `MonthNavigator` consomem, todos calculados em memória a partir
dessas tabelas.

## `MonthRange`

Intervalo de meses que a tela Compras pode exibir, recalculado a cada abertura da tela (nunca
armazenado).

| Campo | Tipo | Descrição |
|---|---|---|
| `earliest` | `{ year: number; month: number }` | Mês da `Compra.dataCompra` mais antiga cadastrada. `undefined` se não houver nenhuma Compra (estado vazio total). |
| `latest` | `{ year: number; month: number }` | O mais distante entre: o mês corrente do dispositivo, e o mês de vencimento da `Fatura` mais distante no futuro que tenha ao menos uma Parcela associada (compra parcelada no cartão com parcelas ainda não lançadas — FR-009). |

Regra: a seta de voltar fica desabilitada quando o mês exibido é igual a `earliest` (ou não existe
`earliest`); a seta de avançar fica desabilitada quando o mês exibido é igual a `latest`.

## `PaymentBreakdown`

Divisão do total de um mês por forma de pagamento (FR-010), calculada a partir da lista de compras
daquele mês.

| Campo | Tipo | Descrição |
|---|---|---|
| `total` | `integer` (centavos) | Soma de todas as compras do mês, qualquer forma de pagamento. |
| `porFormaPagamento` | `{ formaPagamento: 'CARTAO' \| 'PIX'; total: integer }[]` | Um item por forma de pagamento com pelo menos uma compra no mês; ausente do array quando o total daquela forma é zero (a barra/legenda só mostra o que existe). |

## `PurchaseListRow`

Formato único de linha de lista usado tanto na visão por dia (mês corrente/passado) quanto dentro de
cada grupo de fatura (mês futuro previsto) — unifica Parcela no cartão e Parcela via Pix num único
shape para a UI não precisar ramificar por forma de pagamento. **A unidade da linha é a Parcela, não
a Compra** (ver `contracts/purchases-overview.md` — Decisão-chave): uma compra parcelada em 4x gera
4 `PurchaseListRow`, uma por mês, cada uma com seu próprio `parcelaId`.

| Campo | Tipo | Descrição |
|---|---|---|
| `parcelaId` | `string` | FK para `Parcela.id` — chave de item de lista (`key` do React). |
| `compraId` | `string` | FK para `Compra.id` — usado para abrir o detalhe/edição existente (FR-016), que mostra a Compra inteira, não só esta parcela. |
| `descricao` | `string` | `Compra.descricao`. |
| `categoria` | `{ nome: string; icone: string } \| null` | Via `Compra.categoriaId`, já resolvido (mesmo padrão já usado em outras listas do app). |
| `valor` | `integer` (centavos) | Valor desta parcela/ocorrência (não o total original quando parcelado). |
| `formaPagamento` | `'CARTAO' \| 'PIX'` | `Compra.formaPagamento`. |
| `nomeCartao` | `string \| null` | Nome do `Cartão`, presente apenas quando `formaPagamento = 'CARTAO'`. |
| `parcela` | `{ atual: number; total: number } \| null` | Presente apenas quando `Compra.parcelasTotal > 1`; alimenta o indicador "N/total" (FR-011). |
| `dataCompra` | `Date` | O "dia" desta parcela para agrupamento (FR-010): `Compra.dataCompra` quando Pix; `Fatura.dataVencimento` quando cartão (ver `contracts/purchases-overview.md`) — não é sempre a data original da compra. |

## `MonthOverview`

O modelo de tela completo para um mês exibido — o que a tela Compras efetivamente renderiza.

| Campo | Tipo | Descrição |
|---|---|---|
| `year`, `month` | `number` | Mês exibido. |
| `kind` | `'atual' \| 'passado' \| 'futuro-previsto'` | Determina o layout: `'atual'`/`'passado'` usam agrupamento por dia (FR-010); `'futuro-previsto'` usa agrupamento por fatura (FR-013). |
| `breakdown` | `PaymentBreakdown` | Resumo do mês (rótulo muda para "Previsto para [mês]" quando `kind = 'futuro-previsto'`, mas o cálculo é o mesmo). |
| `groupedByDay` | `{ label: string; rows: PurchaseListRow[] }[] \| null` | Preenchido quando `kind ∈ {'atual', 'passado'}`; `label` é "Hoje", "Ontem" ou a data por extenso. `null` no caso futuro. |
| `groupedByInvoice` | `{ cartaoNome: string; dataVencimento: Date; rows: PurchaseListRow[] }[] \| null` | Preenchido quando `kind = 'futuro-previsto'` (uma entrada por `Fatura` com parcela naquele mês); `null` nos outros casos. |
| `range` | `MonthRange` | Repassado para o `MonthNavigator` decidir quais setas habilitar. |

## Fora de escopo

- **Dinheiro como forma de pagamento**: `formaPagamento` continua limitado a `'CARTAO' \| 'PIX'`
  nesta feature (spec.md FR-020) — nenhum valor novo de enum, nenhuma migration.
