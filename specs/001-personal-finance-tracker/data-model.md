# Phase 1 Data Model: Controle Financeiro Pessoal — Núcleo

Formaliza as Key Entities do `spec.md` em tabelas Drizzle (`sqlite-core`). Todas as tabelas vivem em
`app/db/schema.ts`. IDs são `text` (UUID v4, via `expo-crypto`); datas são `integer` (Unix ms,
`{ mode: 'timestamp_ms' }`); valores monetários são `integer` em centavos (evita erro de ponto
flutuante em somas de fatura/saldo — FR-011, FR-015, SC-003).

## Cartão

| Campo | Tipo | Regras |
|---|---|---|
| `id` | text PK | UUID |
| `nome` | text NOT NULL | |
| `diaFechamento` | integer NOT NULL | 1–31; clamp para o último dia do mês em meses curtos (Edge Case) |
| `diaVencimento` | integer NOT NULL | 1–31; mesmo clamp |
| `arquivadoEm` | integer nullable | timestamp; `NULL` = ativo. Cartão arquivado some das opções de nova compra e da sugestão de melhor cartão (FR-025), mas suas faturas continuam existindo |
| `criadoEm` | integer NOT NULL | |

Relacionamentos: 1 Cartão → N Fatura; 1 Cartão → N Compra (`formaPagamento = CARTAO`); 1 Cartão → N
Assinatura (`formaPagamento = CARTAO`).

## Fatura

| Campo | Tipo | Regras |
|---|---|---|
| `id` | text PK | UUID |
| `cartaoId` | text FK → Cartão | |
| `referenciaAno` | integer NOT NULL | |
| `referenciaMes` | integer NOT NULL | 1–12 |
| `dataFechamento` | integer NOT NULL | derivada de `Cartão.diaFechamento` no momento da criação |
| `dataVencimento` | integer NOT NULL | derivada de `Cartão.diaVencimento` |
| `status` | text NOT NULL | enum `ABERTA` \| `FECHADA` \| `PAGA` |
| `pagaEm` | integer nullable | |

Constraint: único por `(cartaoId, referenciaAno, referenciaMes)` — uma Fatura por cartão por mês.

**Ciclo de vida / criação sob demanda**: Faturas não são pré-geradas para o futuro inteiro. Uma
Fatura é criada (upsert idempotente) sempre que uma Parcela precisa se referir a ela — seja ao
registrar uma Compra parcelada (FR-006, cria as N faturas futuras necessárias), seja ao gerar a
cobrança mensal de uma Assinatura (FR-017). `status` transiciona `ABERTA → FECHADA` quando a data
atual ultrapassa `dataFechamento` (calculado, não precisa de job — ver `contracts/invoices.md`) e
`FECHADA → PAGA` apenas por ação explícita do usuário (botão "Marcar fatura como paga", visto no
design de `FaturaDetalhe.dc.html`).

Valor total (FR-011) e soma de responsabilidade (FR-053) **não são colunas persistidas** — são
sempre derivados somando as `Parcela.valor` (e `Parcela.valorResponsabilidade`) daquela fatura, para
nunca divergir da fonte de verdade (SC-003).

## Compra

| Campo | Tipo | Regras |
|---|---|---|
| `id` | text PK | UUID |
| `descricao` | text NOT NULL | |
| `valorTotalOriginal` | integer NOT NULL | centavos; valor total ORIGINAL da compra (mesmo se parcelamento já em andamento — ver Assumptions) |
| `dataCompra` | integer NOT NULL | |
| `formaPagamento` | text NOT NULL | enum `PIX` \| `CARTAO` |
| `cartaoId` | text FK nullable → Cartão | obrigatório quando `formaPagamento = CARTAO` |
| `parcelasTotal` | integer NOT NULL DEFAULT 1 | ≥1 |
| `parcelaAtual` | integer NOT NULL DEFAULT 1 | 1 ≤ `parcelaAtual` ≤ `parcelasTotal` (FR-005) |
| `comentario` | text nullable | |
| `categoriaId` | text FK nullable → Categoria | |
| `estabelecimentoId` | text FK nullable → Estabelecimento | |
| `estabelecimentoManual` | integer (bool) NOT NULL DEFAULT 0 | `true` quando associado/corrigido manualmente pelo usuário — impede sobrescrita automática (FR-034) |
| `valorResponsabilidade` | integer nullable | centavos; `NULL` = usa o padrão (valor total). Ver regra de precedência abaixo (FR-046, FR-049, FR-051) |
| `motivo` | text nullable | só relevante quando `valorResponsabilidade` manual ≠ total (FR-047) |
| `responsavel` | text nullable | texto livre (FR-047) |
| `origem` | text NOT NULL | enum `MANUAL` \| `CSV_IMPORT` \| `ASSINATURA` |
| `assinaturaId` | text FK nullable → Assinatura | preenchido quando `origem = ASSINATURA` |
| `loteImportacaoId` | text FK nullable → LoteImportacao | preenchido quando `origem = CSV_IMPORT` |
| `criadoEm` | integer NOT NULL | |

Validações (também expressas como schema `zod` compartilhado entre formulário e domínio):
- `formaPagamento = PIX` ⇒ `cartaoId IS NULL`, `parcelasTotal = 1`, `parcelaAtual = 1`.
- `parcelaAtual ≤ parcelasTotal` e `parcelaAtual ≥ 1` (FR-005).
- `valorResponsabilidade`, quando não nulo: `0 ≤ valorResponsabilidade ≤ valorTotalOriginal`
  (FR-048).

**Responsabilidade efetiva** (usada em toda exibição/estatística — FR-049, FR-051, Edge Case de
precedência) é uma função pura, nunca uma coluna:

```
responsabilidadeEfetiva(compra, entradasVinculadas) =
  se entradasVinculadas não vazio:
      valorTotalOriginal - soma(entradasVinculadas.valor)   // nunca abaixo de 0 (clamped)
  senão se compra.valorResponsabilidade não é NULL:
      compra.valorResponsabilidade
  senão:
      compra.valorTotalOriginal
```

Relacionamentos: 1 Compra → N Parcela (sempre ≥1, mesmo à vista — ver Parcela); 1 Compra → N Tag
(via `CompraTag`); 0/1 Compra → N EntradaAvulsa vinculada (reembolsos, FR-050).

## Parcela

| Campo | Tipo | Regras |
|---|---|---|
| `id` | text PK | UUID |
| `compraId` | text FK → Compra | |
| `faturaId` | text FK nullable → Fatura | `NULL` quando a Compra é `PIX` (parcela única sem fatura — ver nota abaixo) |
| `numero` | integer NOT NULL | posição dentro do total (`Compra.parcelasTotal`); pode começar >1 quando o parcelamento já estava em andamento |
| `valor` | integer NOT NULL | centavos; `valorTotalOriginal / parcelasTotal`, arredondamento absorvido pela primeira parcela gerada (Assumption) |
| `valorResponsabilidade` | integer NOT NULL | centavos; `valor × (responsabilidadeEfetiva(compra) / valorTotalOriginal)`, mesma proporção em todas as parcelas (FR-055) |

Nota: para manter FR-011/FR-015 simples ("somar parcelas e compras à vista"), toda Compra —
inclusive PIX à vista — gera exatamente 1 Parcela (`parcelasTotal = 1`), mas uma Parcela de uma
Compra PIX não pertence a nenhuma Fatura (`faturaId = NULL`); ela entra direto no cálculo do saldo
do mês (FR-015) pela `dataCompra`, nunca no total de uma fatura. Isso permite que todo o resto do
sistema (tags herdadas, cálculo de responsabilidade, exibição em listas) trate Parcela de forma
uniforme independente da forma de pagamento.

Relacionamentos: N Parcela → 1 Fatura (agregada em `FR-011`); N Parcela → 1 Compra (herda tags,
comentário, categoria, estabelecimento — FR-008).

## Tag / CompraTag

| Tabela | Campo | Tipo | Regras |
|---|---|---|---|
| `Tag` | `id` | text PK | UUID |
| `Tag` | `nome` | text NOT NULL UNIQUE | |
| `CompraTag` | `compraId` | text FK → Compra | PK composta com `tagId` |
| `CompraTag` | `tagId` | text FK → Tag | |

Todas as Parcelas de uma Compra herdam as tags via `compraId` — não há tabela `ParcelaTag`.

## Assinatura

| Campo | Tipo | Regras |
|---|---|---|
| `id` | text PK | UUID |
| `nome` | text NOT NULL | |
| `valor` | integer NOT NULL | centavos |
| `formaPagamento` | text NOT NULL | enum `PIX` \| `CARTAO` |
| `cartaoId` | text FK nullable → Cartão | obrigatório quando `CARTAO` |
| `diaCobranca` | integer NOT NULL | 1–31, mesmo clamp de mês curto |
| `dataInicio` | integer NOT NULL | primeira cobrança gerada não é anterior a esta data |
| `canceladaEm` | integer nullable | `NULL` = ativa |
| `categoriaId` | text FK nullable → Categoria | herdado pelas Compras geradas |
| `tagsTemplate` | → `AssinaturaTag` (N:N, mesma forma de `CompraTag`) | copiadas para a Compra no momento da geração (cópia, não referência — mudar a assinatura depois não reescreve gerações passadas, ver Edge Case) |

**Geração mensal idempotente**: ao abrir o app (ou entrar na tela de Assinaturas/Início), para cada
Assinatura ativa o sistema verifica se já existe uma Compra com `origem = ASSINATURA`,
`assinaturaId` e `(ano, mês)` de referência iguais ao mês corrente; se não existir e
`diaCobranca` já foi atingido, cria a Compra (com 1 Parcela) copiando forma de pagamento, cartão,
categoria e tags vigentes da Assinatura **naquele momento**. Chave de idempotência:
`(assinaturaId, referenciaAno, referenciaMes)` — nunca duplica.

## Configuração de Renda

| Campo | Tipo | Regras |
|---|---|---|
| `id` | text PK | UUID |
| `valor` | integer NOT NULL | centavos |
| `vigenteDesde` | integer NOT NULL | data a partir da qual este valor é o vigente |

O valor vigente em um mês de referência é o de maior `vigenteDesde` que seja ≤ o início daquele
mês — histórico nunca é reescrito (FR-013).

## Entrada Avulsa

| Campo | Tipo | Regras |
|---|---|---|
| `id` | text PK | UUID |
| `descricao` | text NOT NULL | |
| `valor` | integer NOT NULL | centavos |
| `data` | integer NOT NULL | define o mês de referência no fluxo de caixa |
| `compraVinculadaId` | text FK nullable → Compra | quando presente, representa um reembolso (FR-050); dispara o recálculo de `responsabilidadeEfetiva` da Compra referenciada |

Uma Entrada Avulsa sempre conta no saldo do mês (FR-052), esteja ou não vinculada a uma Compra —
vínculo é só para o cálculo de responsabilidade, nunca reduz o próprio efeito da entrada no saldo.

## Reserva de Dinheiro Guardado

| Campo | Tipo | Regras |
|---|---|---|
| `id` | text PK | UUID |
| `nome` | text NOT NULL | |
| `taxaRendimentoMensalPercentual` | real nullable | cadastro apenas (FR-021); nenhum job aplica automaticamente nesta versão |
| `arquivadoEm` | integer nullable | |

Saldo acumulado **não é uma coluna** — é a soma de todos os `LancamentoReserva.valor` daquela
Reserva (depósitos e rendimentos positivos, retiradas negativas), pelo mesmo princípio de "nunca
divergir da soma dos lançamentos" aplicado à Fatura.

## Lançamento de Reserva

| Campo | Tipo | Regras |
|---|---|---|
| `id` | text PK | UUID |
| `reservaId` | text FK → Reserva | |
| `tipo` | text NOT NULL | enum `DEPOSITO` \| `RETIRADA` \| `RENDIMENTO_MANUAL` \| `RENDIMENTO_AUTOMATICO` (este último reservado para a feature futura — nenhum código o gera ainda) |
| `valor` | integer NOT NULL | centavos; sinal já reflete o tipo (retirada é negativa) |
| `data` | integer NOT NULL | |
| `observacao` | text nullable | |

## Lote de Importação

| Campo | Tipo | Regras |
|---|---|---|
| `id` | text PK | UUID |
| `cartaoId` | text FK → Cartão | |
| `formato` | text NOT NULL | enum `GENERICO` \| `NUBANK` |
| `importadoEm` | integer NOT NULL | |
| `nomeArquivo` | text NOT NULL | |
| `totalLinhas` | integer NOT NULL | |
| `linhasImportadas` | integer NOT NULL | |
| `linhasIgnoradas` | integer NOT NULL | |

Compras com `origem = CSV_IMPORT` referenciam `loteImportacaoId` para permitir auditoria (ex.: tela
`ImportarCSVResultado`).

## Categoria

| Campo | Tipo | Regras |
|---|---|---|
| `id` | text PK | UUID |
| `nome` | text NOT NULL | |
| `icone` | text NOT NULL | nome do ícone lucide |
| `predefinida` | integer (bool) NOT NULL | `true` para as categorias seed (não podem ser excluídas) |

Seed obrigatório na primeira migration: Compras, Transporte, Alimentação, Assinaturas, Saúde,
Lazer, **Outros** (esta última nunca excluível — fallback final, FR-030/FR-037).

Exclusão de categoria personalizada (FR-037): `DELETE` da linha + `UPDATE` em lote de toda Compra
com aquele `categoriaId` para `NULL` (o fallback "Outros" já é automático via FR-030, não precisa
reatribuir explicitamente).

## Estabelecimento

| Campo | Tipo | Regras |
|---|---|---|
| `id` | text PK | UUID |
| `nomeExibicao` | text NOT NULL | |
| `iconeRespaldo` | text NOT NULL | nome do ícone lucide (obrigatório no cadastro) |
| `dominio` | text nullable | usado para busca de logotipo |
| `logoCachePath` | text nullable | caminho local do logotipo baixado (`expo-file-system`); `NULL` até a primeira busca bem-sucedida |
| `criadoEm` | integer NOT NULL | usado como desempate de prioridade de matching (Assumption) |

## Padrão de Reconhecimento

| Campo | Tipo | Regras |
|---|---|---|
| `id` | text PK | UUID |
| `estabelecimentoId` | text FK → Estabelecimento | |
| `texto` | text NOT NULL | comparado por "contém", case-insensitive, contra `Compra.descricao` |

Regra de desempate quando 2+ padrões de estabelecimentos diferentes coincidem com a mesma
descrição (Assumption): (1) padrão mais longo vence; (2) empate de tamanho → estabelecimento com
`criadoEm` mais antigo vence.

## Meta de Consumo Ideal

| Campo | Tipo | Regras |
|---|---|---|
| `id` | text PK | singleton (no máximo 1 linha) |
| `percentualDaRenda` | real NOT NULL | ex.: `0.7` = 70% da renda vigente |

Ausência da linha ⇒ seção de "consumo ideal" não aparece nas Estatísticas (FR-042).

## Diagrama de relacionamento (resumo textual)

```
Cartão 1──N Fatura 1──N Parcela N──1 Compra 1──N Parcela  (Compra PIX: Parcela sem Fatura)
Cartão 1──N Compra (CARTAO)            Compra N──N Tag (via CompraTag)
Cartão 1──N Assinatura (CARTAO)        Assinatura 1──N Compra (origem=ASSINATURA)
Compra N──1 Categoria                  Compra N──1 Estabelecimento 1──N PadraoReconhecimento
Compra 1──N EntradaAvulsa (vínculo de reembolso)
Reserva 1──N LancamentoReserva
LoteImportacao 1──N Compra (origem=CSV_IMPORT)
ConfiguracaoRenda (histórico, sem FK)  MetaConsumoIdeal (singleton, sem FK)
```
