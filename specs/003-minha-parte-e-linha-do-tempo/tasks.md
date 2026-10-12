# Tasks: "Minha parte" × Global, linha do tempo de Compras, Faturas organizadas e gráfico de gastos

**Input**: Design documents from `/specs/003-minha-parte-e-linha-do-tempo/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: só para a lógica pura de `src/domain/**`, no padrão do projeto (`tests/unit/domain/**`,
Jest sem device nem SQLite real). Rodar sempre com
`npx jest --testPathIgnorePatterns '/.claude/'`. Telas, gestos e gráfico são validados on-device
via `quickstart.md`.

**Organization**: tarefas agrupadas por User Story (spec.md), em ordem de prioridade. Cada User
Story corresponde a uma issue no GitHub.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem dependência de tarefa incompleta)
- **[Story]**: US1–US4 (spec.md)

---

## Phase 1: Setup

- [X] T001 Confirmar em `package.json` que `react-native-svg` (15.15.4) e `date-fns` já estão presentes e que nenhuma dependência nova é necessária; confirmar `npx jest --testPathIgnorePatterns '/.claude/'` verde e anotar a contagem atual de erros de `npx tsc --noEmit` (baseline ~21 de typed-routes)

---

## Phase 2: Foundational (bloqueia US2 e US3)

**Purpose**: agrupamento por dia genérico e cabeçalho de dia compartilhados entre Compras (US2) e detalhe da fatura (US3).

- [X] T002 Generalizar `groupByDay` em `src/domain/purchasesOverview/groupByDay.ts` para `groupByDay<T>(rows: T[], getDate: (r: T) => Date, today: Date): DayGroup<T>[]`, ordenando uma CÓPIA desc por `getDate` antes de agrupar (não mutar a entrada); manter rótulos "Hoje"/"Ontem"/"d 'de' MMMM" (ptBR) comparados contra `today`; atualizar `DayGroup` em `src/domain/purchasesOverview/types.ts` para `{ label: string; date: Date; rows: T[] }` genérico e ajustar o chamador em `src/app/(tabs)/compras/index.tsx`
- [X] T003 [P] Atualizar/adicionar testes de `groupByDay` em `tests/unit/domain/purchasesOverview.test.ts`: entrada fora de ordem sai desc; mesmo dia com horários diferentes no mesmo grupo; "Hoje"/"Ontem" relativos ao `today` fixo; entrada não é mutada
- [X] T004 [P] Extrair o cabeçalho de seção de dia hoje inline em `src/app/(tabs)/compras/index.tsx` para `src/components/DayGroupHeader.tsx` (props `label: string`), mesmo estilo visual, e usá-lo em Compras

**Checkpoint**: Compras renderiza igual a antes com o `groupByDay` genérico.

---

## Phase 3: User Story 1 — Saldo pela minha parte + filtro Meu/Global (Priority: P1) 🎯 MVP — issue #21

**Goal**: saldo da Início pela parte do usuário; Estatísticas com base "Meu gasto"/"Global" em todas as seções.

**Independent Test**: quickstart cenários 1–3 (compra Pix de R$ 100 com parte R$ 40 → saldo desconta R$ 40; Estatísticas Global mostra R$ 100).

- [X] T005 [P] [US1] Adicionar `export type SpendingBasis = 'minha' | 'global'` e o campo `valor: number` em `ParcelaComCompra` em `src/domain/statistics/types.ts`; criar `src/domain/statistics/amountOf.ts` com `amountOf(p, basis)` → `basis === 'global' ? p.valor : p.valorResponsabilidade`
- [X] T006 [US1] Parametrizar com `basis: SpendingBasis = 'minha'` (default preserva comportamento atual) as funções `totalSpent` (`src/domain/statistics/totalSpent.ts`), `spendingByCategory` (`spendingByCategory.ts`), `topExpenses` (`topExpenses.ts`, ordenar por `amountOf`) e `subscriptionsShare` (`subscriptionsShare.ts`), todas usando `amountOf`
- [X] T007 [P] [US1] Testes em `tests/unit/domain/statistics.test.ts`: para uma parcela dividida (`valor` 10000, `valorResponsabilidade` 4000) cada função retorna o valor pela parte com `'minha'`/default e pelo total com `'global'`; o bloco existente US12/FR-054 continua verde (adicionar `valor` às fixtures)
- [X] T008 [US1] Em `src/repositories/statisticsRepository.ts`: mapear `valor: parcela.valor` em `toParcelaComCompra`; `getStatistics(kind, anchor = new Date(), basis: SpendingBasis = 'minha')` aplica `basis` a `totalSpent` (atual e anterior), `comparison`, `spendingByCategory`, `topExpenses`, `subscriptionsShare`; adicionar `basis` e `totalMinhaParte = totalSpent(current, 'minha')` a `StatisticsResult`; `idealSpend` SEMPRE com `totalMinhaParte` (FR-005); `getMonthlySpendingHistory` inalterado
- [X] T009 [US1] Em `src/hooks/useStatistics.ts`: assinatura `useStatistics(kind: PeriodKind, basis: SpendingBasis = 'minha', anchor?: Date)`, refazendo a carga quando `kind`/`basis`/`anchor` mudam, mantendo `useFocusEffect`
- [X] T010 [US1] Criar `src/state/statisticsPrefs.ts` (variáveis de módulo, sem persistência, com getters/setters para `basis: SpendingBasis` = `'minha'` e `categoryView: 'lista' | 'grafico'` = `'lista'`); em `src/app/(tabs)/inicio/estatisticas.tsx`: estado `basis` inicializado de `statisticsPrefs` e gravado de volta a cada troca com `SegmentedControl<SpendingBasis>` "Meu gasto"/"Global" logo abaixo do seletor de período (mantido ao trocar período); passar `basis` ao hook; no card de total, quando `basis === 'global' && stats.totalMinhaParte !== stats.totalSpent`, mostrar linha secundária "Sua parte: R$ X" (13px, `$textSecondary`, mesmo padrão de `src/app/cartao/[cardId]/fatura/[invoiceId].tsx`); "Maiores gastos" exibe `amountOf(item, basis)`; trocar o `.sort()` in-place de `stats.spendingByCategory` por ordenação de uma cópia
- [X] T011 [US1] Em `src/repositories/purchasesRepository.ts`: `listPixPurchasesForMonth` passa a retornar `Array<Purchase & { parteUsuario: number }>`, com `parteUsuario = sum(parcelas.valorResponsabilidade)` agrupado por `compras.id` (JOIN em `parcelas`); conferir outros chamadores de `listPixPurchasesForMonth` (grep) e ajustá-los
- [X] T012 [US1] Em `src/hooks/useMonthBalance.ts`: `entradasAvulsas` = `cashEntries.filter(e => !e.compraVinculadaId).map(e => e.valor)` (FR-001a — reembolso vinculado já reduziu a parte, não somar de novo; a lista `entries` retornada continua completa); `comprasPix` = `pix.map(p => p.parteUsuario)`, `faturasVencendo` = `invoices.map(i => i.totalResponsabilidade)`, `expenses` = soma das duas partes; `computeMonthBalance` inalterado; atualizar o docstring citando FR-001/FR-002 da 003
- [X] T013 [P] [US1] Em `tests/unit/domain/cashflow.test.ts`: caso com renda 500000, Pix parte 4000 e fatura parte 70000 → saldo 426000 (documenta a nova base); caso de reembolso (compra 10000, reembolso vinculado 6000 → `comprasPix` [4000] e entrada vinculada excluída → saldo = renda − 4000, nunca renda + 2000); caso sem divisão idêntico ao anterior. Se a filtragem de entradas vinculadas for extraída para uma função pura (ex.: `balanceEntries(entries)` em `src/domain/cashflow/`), testá-la aqui
- [X] T014 [US1] Conferir `src/app/(tabs)/inicio/index.tsx`: subtítulo "Renda · Gastos" já consome `expenses` do hook (agora pela parte); cards "Faturas do mês" continuam com `invoice.total` (Assumption da spec) — sem outras mudanças

**Checkpoint**: US1 testável sozinha (quickstart 1–3).

---

## Phase 4: User Story 2 — Compras como linha do tempo real (Priority: P1) — issue #22

**Goal**: Compras lista compras FEITAS no mês, agrupadas pelo dia real, com "Só minhas" e "Sua parte".

**Independent Test**: quickstart cenários 4–8.

- [X] T015 [US2] Em `src/domain/purchasesOverview/types.ts`: redefinir `PurchaseListRow` por Compra conforme data-model (`compraId`, `descricao`, `categoria`, `valor` = `valorTotalOriginal`, `valorResponsabilidade` = Σ parcelas, `isSplit`, `formaPagamento`, `nomeCartao`, `parcelas: { atual; total } | null` — null quando `parcelasTotal = 1`, `dataCompra` SEMPRE a data real; corrigir docstring); renomear o shape antigo por parcela para `ForecastRow` e usá-lo em `InvoiceGroup`; `PaymentBreakdown` ganha `totalResponsabilidade: number`
- [X] T016 [P] [US2] Criar `src/domain/purchasesOverview/filters.ts` com `type PurchaseFilters = { formaPagamento: 'TODOS' | 'CARTAO' | 'PIX'; soMinhas: boolean }` e `applyPurchaseFilters(rows, filters)` (`soMinhas` remove `isSplit === true`, incluindo parte = 0)
- [X] T017 [P] [US2] Em `src/domain/purchasesOverview/paymentBreakdown.ts`: `computeBreakdown` soma também `totalResponsabilidade` (Σ `valorResponsabilidade`)
- [X] T018 [P] [US2] Testes em `tests/unit/domain/purchasesOverview.test.ts` para `applyPurchaseFilters` (combinações forma × soMinhas; parte 0 conta como dividida) e `computeBreakdown` com `totalResponsabilidade`
- [X] T019 [US2] Em `src/repositories/purchasesRepository.ts`: reescrever `listPurchasesForMonth(year, month)` como UMA query por Compra — `compras` INNER JOIN `parcelas` LEFT JOIN `cartoes` (via `compras.cartaoId`) LEFT JOIN `categorias`, filtro `compras.dataCompra` ∈ mês (`resolvePeriod('MENSAL', …)`), `GROUP BY compras.id`, `sum(parcelas.valorResponsabilidade)`; `ORDER BY compras.dataCompra DESC, compras.criadoEm DESC`; novo mapper `toTimelineRow` (selo: `parcelas = { atual: parcelaAtual, total: parcelasTotal }` quando `parcelasTotal > 1`); `listForecastInvoicesForMonth` passa a usar `ForecastRow`/mapper antigo; atualizar o docstring citando que a decisão da 002 foi substituída (contracts/purchases-timeline.md)
- [X] T020 [US2] Em `src/hooks/usePurchasesOverview.ts`: adaptar aos tipos novos (timeline por Compra, previsão por `ForecastRow`); `monthRange` e `kind` inalterados
- [X] T021 [US2] Em `src/app/(tabs)/compras/index.tsx`: estado `filters: PurchaseFilters`; chip toggle "Só minhas" junto aos chips Todos/Cartão/Pix (oculto no modo previsão); `computeBreakdown` sobre as linhas JÁ filtradas; card de gasto mostra "Sua parte: R$ X" (13px, `$textSecondary`) quando `totalResponsabilidade !== total`; agrupar com `groupByDay(filtered, r => r.dataCompra, today)` + `DayGroupHeader`; estado vazio "Nenhuma compra com esses filtros em {mês}"
- [X] T022 [US2] Em `PurchaseRow` de `src/app/(tabs)/compras/index.tsx`: pill "Nx" quando `parcelas.atual === 1`, "k/N" quando `parcelas.atual > 1` (CSV, research R9); quando `isSplit`, ícone `Users` + subtítulo "Sua parte: R$ X" (12px, `$textTertiary`) como em `fatura/[invoiceId].tsx`; navegação de toque para `compra/[compraId]` inalterada; linhas planas com divisória
- [X] T023 [US2] Verificar que "Ver tudo" de "Transações recentes" em `src/app/(tabs)/inicio/index.tsx` continua abrindo Compras no mês corrente e que a visão de previsão de meses futuros está idêntica (FR-010)

**Checkpoint**: US2 testável sozinha (quickstart 4–8).

---

## Phase 5: User Story 3 — Faturas do cartão organizadas (Priority: P2) — issue #23

**Goal**: lista de faturas por ano sem as pagas por padrão; detalhe agrupado por dia.

**Independent Test**: quickstart cenários 9–11.

- [X] T024 [P] [US3] Criar `src/domain/invoices/invoiceYearView.ts` com `availableYears(invoices)` (anos distintos de `dataVencimento`, asc), `initialYear(years, today)` (ano corrente se presente, senão o mais próximo; `undefined` se vazio), `filterInvoicesForYear(invoices, year, showPaid)` (exclui `status === 'PAGA'` quando `!showPaid`; FUTURA pertence ao ano do vencimento) e `countPaidInYear(invoices, year)`
- [X] T025 [P] [US3] Testes em `tests/unit/domain/invoices.test.ts` para `invoiceYearView` (anos de 2025/2026, initialYear sem o ano corrente, pagas ocultas/mostradas, contagem)
- [X] T026 [US3] Em `src/app/cartao/[cardId]/index.tsx`: estados `year` (de `initialYear`) e `showPaid` (false); `MonthNavigator` com `label={String(year)}`, `prevDisabled`/`nextDisabled` nos limites de `availableYears` (oculto sem faturas); botão de texto "Mostrar pagas (n)"/"Ocultar pagas" à direita do título "Faturas" (oculto quando n = 0); aplicar a ordenação atual sobre o subconjunto filtrado; estado vazio "Nenhuma fatura em aberto em {ano}" + "{n} paga(s) oculta(s)"
- [X] T027 [US3] Em `src/repositories/purchasesRepository.ts`: `listPurchasesForInvoice` com `orderBy(desc(compras.dataCompra), desc(compras.criadoEm))`
- [X] T028 [US3] Em `src/app/cartao/[cardId]/fatura/[invoiceId].tsx`: agrupar com `groupByDay(rows, r => r.compra.dataCompra, today)` + `DayGroupHeader`, mantendo o conteúdo de cada linha (avatar, pill, tags, "Sua parte") e linhas planas com divisória (depende de T002/T004)

**Checkpoint**: US3 testável sozinha (quickstart 9–11).

---

## Phase 6: User Story 4 — Gasto por categoria em gráfico de rosca + detalhamento (Priority: P3) — issue #24

**Goal**: seletor Lista/Gráfico na seção de categoria; rosca top 5 + "Outras"; toque abre detalhamento.

**Independent Test**: quickstart cenários 12–14. **Depende de US1** (`basis`).

- [ ] T029 [P] [US4] Criar `src/domain/statistics/categoryShare.ts` com `CategoryShare` (data-model) e `toCategoryShare(spending, topN = 5)` (ordena desc, ignora total ≤ 0, top 5 + um único "Outras" por último somente se houver restantes, `pct` com 1 casa e último item ajustado para somar exatamente 100) e `toCategoryShareFull(spending)` (sem agrupamento)
- [ ] T030 [P] [US4] Testes em `tests/unit/domain/statistics.test.ts` para `categoryShare`: 8 categorias → 6 itens com "Outras" por último; 3 categorias → sem "Outras"; total 0 → `[]`; soma de pct = 100; categoria única = 100
- [ ] T031 [P] [US4] Adicionar em `src/theme/colors.ts` `chartCategorical` (5 cores distintas legíveis sobre o fundo claro) e `chartOther` (cinza neutro)
- [ ] T032 [P] [US4] Criar `src/components/DonutChart.tsx` com `react-native-svg` conforme contracts/category-share-chart.md (props `segments`, `size = 160`, `thickness = 22`, `centerLabel`, `onPress`, `accessibilityLabel`; `G` rotacionado -90°, `Circle` por segmento com `strokeDasharray`/`strokeDashoffset`, trilho `$borderColor`; segmento único = anel completo; todos 0 → sem anel; `Pressable` com `accessibilityRole="button"` quando `onPress`)
- [ ] T033 [US4] Em `src/app/(tabs)/inicio/estatisticas.tsx`: estado `categoryView: 'lista' | 'grafico'` inicializado de `statisticsPrefs` (T010) e gravado de volta a cada troca, para sobreviver ao sair/voltar da tela (spec US4 cenário 5) com `SegmentedControl` no cabeçalho de "Gasto por categoria"; modo gráfico = `DonutChart` com `toCategoryShare(stats.spendingByCategory)` + legenda compacta (cor, nome, %); total no centro pela `basis`; estado vazio quando total = 0; toque → `router.push({ pathname: '/inicio/estatisticas-categorias', params: { kind, anchor: anchor.toISOString(), basis } })`
- [ ] T034 [US4] Criar `src/app/(tabs)/inicio/estatisticas-categorias.tsx` e registrar `<Stack.Screen name="estatisticas-categorias" />` em `src/app/(tabs)/inicio/_layout.tsx`: header com voltar + "Gasto por categoria" + período e base; `useStatistics(kind, basis, new Date(anchor))`; `DonutChart` grande com `toCategoryShare`; lista plana com divisórias de `toCategoryShareFull` (ícone Lucide da categoria, nome, %, `Money`) dentro de `Screen`

**Checkpoint**: US4 testável (quickstart 12–14).

---

## Phase 7: Polish & Cross-Cutting

- [ ] T035 Rodar `npx jest --testPathIgnorePatterns '/.claude/'`, `npx tsc --noEmit` (sem erros novos além do baseline de T001) e `npx eslint src`; corrigir regressões
- [ ] T036 Executar `specs/003-minha-parte-e-linha-do-tempo/quickstart.md` on-device (Expo Go, com logs do Metro em processo de fundo) e registrar o resultado; passar ao usuário as instruções de teste no celular por User Story
- [ ] T037 [P] Atualizar `specs/002-central-de-compras/contracts/purchases-overview.md` com uma nota no topo apontando que a decisão-chave (Parcela por vencimento) foi substituída por `specs/003-minha-parte-e-linha-do-tempo/contracts/purchases-timeline.md`

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002–T004)** → US2 e US3.
- **US1 (T005–T014)** independe da Foundational; pode começar logo após T001.
- **US2 (T015–T023)** depende de T002/T004.
- **US3 (T024–T028)** depende de T002/T004 (T028); T024–T027 independentes.
- **US4 (T029–T034)** depende de US1 (T005, T008, T009) para `basis`.
- **Polish (T035–T037)** depois das stories desejadas.

Ordem de entrega sugerida: US1 → US2 → US3 → US4 (uma issue/PR-commit por story).

## Parallel Examples

- US1: T005 ∥ T013 (arquivos distintos); depois T006 → T007 ∥ T008.
- US2: T016 ∥ T017 ∥ T018 após T015.
- US3: T024 ∥ T025 ∥ T027.
- US4: T029 ∥ T030 ∥ T031 ∥ T032, depois T033 → T034.

## Implementation Strategy

- **MVP**: Phase 1 + US1 — corrige o número mais visível do app (saldo) e destrava o filtro global.
- Incremental: cada story fecha sua issue e é validada no aparelho antes da próxima.
