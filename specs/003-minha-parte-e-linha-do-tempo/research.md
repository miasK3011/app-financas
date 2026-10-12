# Research: Feature 003

## R1 — Unidade de listagem da tela Compras: Compra (por `dataCompra`), não Parcela

- **Decision**: `listPurchasesForMonth` passa a retornar **uma linha por Compra** cuja
  `compras.dataCompra` cai no mês (cartão e Pix), agrupada pelo dia real da compra. Valor da linha =
  `compra.valorTotalOriginal`; parte do usuário = soma de `parcelas.valorResponsabilidade` da compra.
  Compra parcelada mostra selo "Nx" (`parcelasTotal`).
- **Rationale**: decisão confirmada pelo usuário (spec Clarifications Q1) — a tela é uma linha do
  tempo do que foi comprado. O contrato da 002 (`contracts/purchases-overview.md`) havia escolhido
  a Parcela por vencimento para o total de Compras bater com o "Gastos" da Início; essa
  equivalência deixa de existir **de propósito**: Início = fluxo de caixa do mês (o que vence),
  Compras = o que foi comprado no mês. O total de Compras deixa de ser comparável ao saldo, e isso
  fica documentado no contrato novo.
- **Alternatives considered**: (a) manter Parcela por vencimento e só reagrupar pela data original —
  rejeitada (mostra dias de setembro dentro de outubro); (b) uma linha por parcela com valor da
  parcela no mês da compra — rejeitada pelo usuário.
- **Consequência**: a visão de previsão (`kind = 'futuro-previsto'`, `listForecastInvoicesForMonth`)
  continua por Parcela/Fatura e inalterada (FR-010). A decisão `kind` por mês continua igual.

## R2 — Parte do usuário: usar o valor já persistido

- **Decision**: usar `parcelas.valorResponsabilidade` (NOT NULL, já gravado com
  `resolveResponsibility` aplicado em toda escrita — `purchasesRepository.ts` em create/update/
  vincular entrada) e `InvoiceWithTotals.totalResponsabilidade`. Não recalcular
  `resolveResponsibility` na leitura.
- **Rationale**: fonte única já mantida consistente pelos writes; evita JOIN com `entradasAvulsas`.
- **"Só minhas"/`isSplit`**: `isSplit = Σ parcelas.valorResponsabilidade < compra.valorTotalOriginal`
  (valores são inteiros em centavos — comparação exata). Cobre divisão manual e reembolso vinculado (Clarifications Q2) sem
  consultar `entradasAvulsas`. Edge case parte = 0 → `isSplit = true`.

## R3 — Base de cálculo das Estatísticas

- **Decision**: tipo `SpendingBasis = 'minha' | 'global'`; `ParcelaComCompra` ganha `valor`;
  helper `amountOf(p, basis)`; `totalSpent`, `spendingByCategory`, `topExpenses`,
  `subscriptionsShare` recebem `basis` com default `'minha'` (mantém chamadores e testes
  existentes, ex. `getMonthlySpendingHistory`). `getStatistics(kind, anchor, basis)` devolve também
  `totalMinhaParte` para o subtítulo do card em modo global (FR-004). `idealSpend` sempre calculado
  com `'minha'` (FR-005).
- **Alternatives**: retornar os dois resultados sempre (dobra o trabalho) — rejeitada; filtro só
  na tela — rejeitada (lógica fora do domínio, sem teste).

## R4 — Saldo da Início

- **Decision**: em `useMonthBalance`, Pix soma a parte por compra (`listPixPurchasesForMonth` passa
  a retornar `{ ...compra, valorResponsabilidade }` via JOIN/agrupamento em `parcelas`), faturas
  usam `invoice.totalResponsabilidade`. `computeMonthBalance` inalterado (recebe arrays de números).
- **Consequência**: saldo, subtítulo "Gastos" e o gráfico "Consumo mensal" (já pela parte)
  ficam coerentes (SC-001). Cards "Faturas do mês" seguem com `invoice.total` (Assumption da spec).

## R5 — Gráfico de rosca sem biblioteca nova

- **Decision**: `DonutChart` com `react-native-svg`: um `<Circle>` por segmento, `strokeWidth` =
  espessura do anel, `strokeDasharray = [len, circ - len]`, `strokeDashoffset` acumulado, grupo
  rotacionado -90° para começar no topo; total no centro via overlay Tamagui (`Money`). Toque no
  componente inteiro (`Pressable`) → `onPress`. Segmento único = anel completo; total 0 → estado
  vazio.
- **Rationale**: `react-native-svg` já é dependência e funciona no Expo Go; desenho de rosca é ~60
  linhas; Victory/Skia/gifted-charts trariam dependência nova (Princípio II/V).
- **Paleta**: 6 cores categóricas fixas por posição do ranking (top 5 + "Outras" em cinza neutro),
  em `src/theme/colors.ts`, com contraste suficiente sobre o fundo claro do app.

## R6 — Navegação por ano na lista de faturas

- **Decision**: reaproveitar `MonthNavigator` (props genéricas `label/onPrev/onNext/prevDisabled/
  nextDisabled`) com `label = "2026"`; lógica pura em `domain/invoices/invoiceYearView.ts`:
  `availableYears(invoices)` (por ano de `dataVencimento`) e `filterInvoicesForYear(invoices, year,
  showPaid)` + `countPaid`. Ano inicial: ano corrente se existir em `availableYears`, senão o mais
  próximo. Sem renomear o componente (cosmético).
- **Rationale**: zero componente novo; swipe também funciona por herança.

## R7 — Agrupamento por dia compartilhado

- **Decision**: `groupByDay<T>(rows, getDate, today)` genérico que **ordena desc** antes de agrupar
  (o detalhe da fatura não tem ORDER BY hoje); `DayGroup<T>`. Cabeçalho de dia extraído para
  `components/DayGroupHeader.tsx` e usado nas duas telas. `listPurchasesForInvoice` ganha
  `orderBy(desc(compras.dataCompra), desc(compras.criadoEm))` para estabilidade (mesmo desempate
  usado em `listPurchasesForMonth`).

## R8 — Rota do detalhamento por categoria

- **Decision**: `src/app/(tabs)/inicio/estatisticas-categorias.tsx`, registrada no Stack de
  `inicio/_layout.tsx`; parâmetros `kind`, `anchor` (ISO) e `basis`. Só é alcançável a partir de
  Estatísticas (que só existe na aba Início) → não cai na regra de rota cruzada entre abas.

## R9 — Compras importadas via CSV ("Parcela k/N")

- **Contexto**: o import CSV ancora a data da linha na própria parcela k/N (memória do projeto,
  FR-006 da 001) e cria uma Compra com `parcelaAtual = k`, `parcelasTotal = N`.
- **Decision**: na linha do tempo, uma Compra com `parcelaAtual > 1` mostra o selo "k/N" (em vez
  de "Nx") e o valor da própria compra; uma Compra com `parcelaAtual = 1` e `parcelasTotal > 1`
  mostra "Nx". Não há tentativa de deduplicar/reconstruir a compra original a partir do CSV
  (fora de escopo; ver issue #12 para duplicidade).
