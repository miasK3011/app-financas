# Tasks: Central de Compras e Navegação Simplificada

**Input**: Design documents from `/specs/002-central-de-compras/`

**Prerequisites**: [plan.md](./plan.md) (obrigatório), [spec.md](./spec.md) (User Stories),
[data-model.md](./data-model.md), [contracts/purchases-overview.md](./contracts/purchases-overview.md),
[quickstart.md](./quickstart.md)

**Tests**: incluídas apenas para a lógica pura de `src/domain/purchasesOverview/**`, seguindo
exatamente o padrão já usado no projeto (feature 001 — `tests/unit/domain/**`, Jest sem device nem
SQLite real). Não há testes de integração/UI nesta lista porque `tests/integration/` não é, na
prática, usada neste projeto (roteamento/gestos exigem dispositivo real — validados via
`quickstart.md`).

**Organization**: tarefas agrupadas por User Story (spec.md), em ordem de prioridade (P1 → P2 → P3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem dependência de tarefa incompleta)
- **[Story]**: a qual User Story pertence (US1, US2, US3)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto Expo único (`src/`), convenção já estabelecida na feature 001 — ver `plan.md` → Project
Structure para a árvore completa desta feature.

---

## Phase 1: Setup

**Purpose**: confirmar pré-condições antes de qualquer story — esta feature não introduz nenhuma
dependência nova.

- [ ] T001 Confirmar em `package.json` que `react-native-gesture-handler`, `react-native-reanimated`
      e `date-fns` já estão presentes (estão — usados pelo gesto de swipe do `MonthNavigator` e pela
      aritmética de mês); escolher o ícone Lucide da aba Compras (ex.: `Receipt`, consistente com os
      demais ícones de `src/app/(tabs)/_layout.tsx`) para uso em T008

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: tipos e lógica de agregação compartilhados por US1 e US2 — nenhuma story começa antes
disto estar pronto.

**⚠️ CRITICAL**: nenhuma tarefa de User Story pode começar antes desta fase estar completa.

- [ ] T002 [P] Criar `src/domain/purchasesOverview/types.ts` com os tipos de `data-model.md`:
      `PurchaseListRow` (campos: `parcelaId`, `compraId`, `descricao`, `categoria`, `valor` — "valor
      desta parcela/ocorrência, não o total original quando parcelado" —, `formaPagamento` (`'CARTAO'
      | 'PIX'`), `nomeCartao` — "presente apenas quando `formaPagamento = 'CARTAO'`" —, `parcela`
      (`{ atual; total } | null` — "presente apenas quando `Compra.parcelasTotal > 1`") —,
      `dataCompra`), `PaymentBreakdown` (`total`, `porFormaPagamento[]`), `MonthRange` (`earliest`,
      `latest`, ambos `{ year; month } | undefined`), `MonthOverview` (`year`, `month`, `kind: 'atual'
      | 'passado' | 'futuro-previsto'`, `breakdown`, `groupedByDay`, `groupedByInvoice`, `range`)
- [ ] T003 [P] Implementar `src/domain/purchasesOverview/groupByDay.ts` — `groupByDay(rows:
      PurchaseListRow[], today: Date)`: agrupa por dia calendário de `row.dataCompra`; rótulo `"Hoje"`
      quando `isToday`, `"Ontem"` quando `isYesterday` (`date-fns`), senão `"{d} de {mês por
      extenso}"`; grupos e linhas dentro de cada grupo ordenados do mais recente para o mais antigo
      (contracts/purchases-overview.md)
- [ ] T004 [P] Implementar `src/domain/purchasesOverview/paymentBreakdown.ts` —
      `computeBreakdown(rows: PurchaseListRow[])`: soma `valor` de todas as linhas em `total`; agrupa
      a soma por `formaPagamento`, "omitindo do array qualquer forma de pagamento com soma zero"
      (contracts/purchases-overview.md)
- [ ] T005 Testes unitários de `groupByDay` e `computeBreakdown` em
      `tests/unit/domain/purchasesOverview.test.ts`: rótulos "Hoje"/"Ontem"/data por extenso e
      ordenação (groupByDay); soma total, soma por forma de pagamento, e omissão de forma com total
      zero (computeBreakdown) — depende de T002, T003, T004
- [ ] T006 Estender `src/repositories/purchasesRepository.ts` com `listPurchasesForMonth(year:
      number, month: number): Promise<PurchaseListRow[]>` per `contracts/purchases-overview.md`:
      `Period` via `resolvePeriod('MENSAL', new Date(year, month - 1, 15)).current`; duas queries no
      padrão de `listParcelasForPeriod` (Pix: `parcelas` `INNER JOIN compras` com `faturaId IS NULL` e
      `dataCompra` no período; Cartão: `parcelas` `INNER JOIN compras` `INNER JOIN faturas` `INNER
      JOIN cartoes` com `faturas.dataVencimento` no período), ambas com `LEFT JOIN categorias`; "dia"
      de cada linha = `compras.dataCompra` (Pix) ou `faturas.dataVencimento` (Cartão); ordenar do
      mais recente para o mais antigo — depende de T002
- [ ] T007 [P] Criar `src/components/PaymentMethodBadge.tsx` — pequeno selo circular sobreposto
      (ícone de cartão para `CARTAO`, ícone de raio para `PIX`), e um wrapper `PurchaseAvatar` que
      combina `TransactionAvatar` (já existente, `src/components/TransactionAvatar.tsx`) com este
      selo, recebendo `categoria`, `estabelecimento` e `formaPagamento`

**Checkpoint**: tipos, agregação pura e query de mês prontos — as User Stories podem começar.

---

## Phase 3: User Story 1 - Ver todas as transações do mês, de qualquer forma de pagamento (Priority: P1) 🎯 MVP

**Goal**: nova aba Compras mostrando, para o mês corrente, todas as compras (cartão + Pix) num só
lugar, com resumo por forma de pagamento, filtro rápido e lista por dia.

**Independent Test**: `quickstart.md` → Cenário 1.

### Implementation for User Story 1

- [ ] T008 [US1] Adicionar `<Tabs.Screen name="compras" options={{ title: 'Compras', tabBarIcon:
      ... }} />` em `src/app/(tabs)/_layout.tsx`, com o ícone escolhido em T001 (FR-001 parcial —
      nesta fase convivem 6 abas; T028 na US3 remove Assinaturas/Reservas para chegar a 4)
- [ ] T009 [US1] Criar `src/app/(tabs)/compras/_layout.tsx` — `Stack` com `headerShown: false`,
      só a rota `index` por enquanto
- [ ] T010 [US1] Criar `src/app/(tabs)/compras/index.tsx`: título "Compras"; rótulo de mês estático
      centralizado (texto simples "{Mês} · {Ano}" do mês corrente — sem setas nesta story, a US2
      substitui por `MonthNavigator`); busca `listPurchasesForMonth(anoAtual, mesAtual)` (T006) ao
      focar a tela (`useFocusEffect`, mesmo padrão de outras listas do app — ver memória do projeto
      sobre por que não usar `useEffect` puro)
- [ ] T011 [US1] Renderizar bloco de resumo com `computeBreakdown` (T004): total do mês
      (`summary-value`) + barra proporcional + legenda com o valor de cada forma de pagamento
      presente, reaproveitando os tokens de cor/tipografia de `src/theme` (FR-010, FR-019)
- [ ] T012 [US1] Renderizar chips de filtro "Todos" / "Cartão" / "Pix" com estado local
      (`useState`), filtrando `PurchaseListRow[]` por `formaPagamento` antes de agrupar por dia;
      "Todos" volta a mostrar todas (FR-012)
- [ ] T013 [US1] Renderizar a lista agrupada por dia (saída de `groupByDay`, T003), **sem** wrapper
      `card` com borda/fundo — linhas simples com divisória fina, igual ao padrão já usado em
      Cartões/Início/Reservas (FR-011, FR-018); cada linha usa `PurchaseAvatar` (T007) e mostra
      descrição, categoria, forma de pagamento (+ `nomeCartao` quando `formaPagamento = 'CARTAO'`),
      `valor`, e o indicador "N/total" quando `row.parcela` não é `null`
- [ ] T014 [US1] Adicionar botão de ação flutuante reaproveitando a rota existente
      (`router.push('/nova-compra')`, mesmo fluxo do FAB já usado em Início) (FR-015)
- [ ] T015 [US1] `onPress` de cada linha da lista navega para `router.push(`/compra/${row.compraId}`)`,
      reaproveitando a tela de detalhe/edição de compra já existente (FR-016)
- [ ] T016 [US1] Em `src/app/(tabs)/inicio/index.tsx`, adicionar um link "Ver tudo" ao lado do
      título "Transações recentes" (mesmo padrão visual do link "Ver estatísticas" já existente na
      mesma tela), navegando para `router.push('/compras')` (FR-017)

**Checkpoint**: User Story 1 completa e testável de forma independente (`quickstart.md` Cenário 1).

---

## Phase 4: User Story 2 - Navegar entre meses para ver histórico e compras já previstas (Priority: P2)

**Goal**: navegador de mês (setas + swipe) com limites corretos, e visão de mês futuro previsto
agrupada por fatura.

**Independent Test**: `quickstart.md` → Cenário 2.

### Implementation for User Story 2

- [ ] T017 [P] [US2] Implementar `src/domain/purchasesOverview/monthRange.ts` —
      `computeMonthRange(earliestCompraDate: Date | null, invoiceDueDatesWithParcela: Date[], today:
      Date): MonthRange`: `earliest` = mês de `earliestCompraDate` (`undefined` se `null`); `latest` =
      "o maior entre o mês de `today` e o mês de `max(invoiceDueDatesWithParcela)`" (`today` quando a
      lista estiver vazia — FR-009, seta de avançar já desabilitada no mês corrente sem parcela
      futura)
- [ ] T018 [P] [US2] Testes unitários de `computeMonthRange` em
      `tests/unit/domain/purchasesOverview.test.ts`: sem parcela futura (avançar desabilitado no mês
      corrente); parcelas futuras lançadas para os próximos 2 meses (chega até o 2º, não além); sem
      nenhuma Compra cadastrada (`earliest` indefinido)
- [ ] T019 [US2] Repositório: obter `earliestCompraDate` (`MIN(compras.dataCompra)`) e a lista de
      `Fatura.dataVencimento` de toda `Fatura` com ao menos uma `Parcela` associada, em
      `src/repositories/purchasesRepository.ts` (ou `invoicesRepository.ts`), alimentando
      `computeMonthRange` (T017)
- [ ] T020 [US2] Implementar `listForecastInvoicesForMonth(year: number, month: number)` em
      `src/repositories/purchasesRepository.ts` per `contracts/purchases-overview.md`: reaproveita
      `invoicesRepository.listInvoicesDueInMonth(year, month)` (já existente) +
      `purchasesRepository.listPurchasesForInvoice(invoiceId)` (já existente) por fatura, convertendo
      `InvoicePurchaseRow` para `PurchaseListRow` (T002) (FR-013)
- [ ] T021 [P] [US2] Criar `src/components/MonthNavigator.tsx`: seta de voltar, rótulo centralizado,
      seta de avançar — cada seta recebe `disabled` via prop (estilo esmaecido quando desabilitada);
      gesto de swipe horizontal sobre a área do navegador usando `react-native-gesture-handler` +
      `react-native-reanimated`, chamando `onPrev`/`onNext` (mesmo efeito de tocar nas setas) (FR-006,
      FR-007)
- [ ] T022 [US2] Em `(tabs)/compras/index.tsx`, substituir o rótulo estático de T010 pelo
      `MonthNavigator` (T021), com `selectedYear`/`selectedMonth` em estado local; "a seta de voltar
      fica desabilitada quando o mês exibido é igual a `earliest` (ou não existe `earliest`); a seta
      de avançar fica desabilitada quando o mês exibido é igual a `latest`" (T017/`data-model.md`)
      (FR-005, FR-008, FR-009)
- [ ] T023 [US2] Em `(tabs)/compras/index.tsx`, ramificar o conteúdo pelo `kind` do mês selecionado:
      `'atual'`/`'passado'` mantém resumo + filtro + lista por dia (T011–T013), buscando
      `listPurchasesForMonth` (T006) para o mês selecionado; `'futuro-previsto'` busca
      `listForecastInvoicesForMonth` (T020), mostra o mesmo bloco de resumo (T011) com o rótulo
      trocado para "Previsto para [mês]", e a lista agrupada por fatura (nome do cartão + data de
      vencimento) em vez de por dia — "não deve usar nenhum selo ou banner adicional de 'previsto'
      além da seta de avançar desabilitada e do rótulo do próprio resumo" (FR-013, FR-014)
- [ ] T024 [US2] Esconder o botão de ação flutuante (T014) quando `kind = 'futuro-previsto'`
      (FR-015 — FAB só em mês atual/passado)

**Checkpoint**: User Stories 1 e 2 completas e testáveis de forma independente (`quickstart.md`
Cenários 1 e 2).

---

## Phase 5: User Story 3 - Navegação principal mais enxuta (Priority: P3)

**Goal**: 4 abas na navegação principal; Assinaturas e Reservas viram itens dentro de "Mais",
organizada em seções.

**Independent Test**: `quickstart.md` → Cenário 3.

### Implementation for User Story 3

- [ ] T025 [US3] Mover `src/app/(tabs)/assinaturas/index.tsx` e
      `src/app/(tabs)/assinaturas/[subscriptionId].tsx` para `src/app/(tabs)/mais/assinaturas/`
      (mesmo conteúdo, nenhuma mudança de comportamento interno); atualizar
      `router.push('/assinaturas/nova')` (dentro do `index.tsx` movido) para
      `router.push('/mais/assinaturas/nova')`
- [ ] T026 [US3] Mover `src/app/(tabs)/reservas/index.tsx` e
      `src/app/(tabs)/reservas/[reserveId].tsx` para `src/app/(tabs)/mais/reservas/`; atualizar
      `router.push('/reservas/nova')` para `router.push('/mais/reservas/nova')`
- [ ] T027 [US3] Em `src/app/(tabs)/mais/_layout.tsx`, adicionar `<Stack.Screen
      name="assinaturas/index" />`, `<Stack.Screen name="assinaturas/[subscriptionId]"
      options={{ presentation: 'modal' }} />` e o par equivalente para `reservas/*`
- [ ] T028 [US3] Remover `src/app/(tabs)/assinaturas/_layout.tsx` e
      `src/app/(tabs)/reservas/_layout.tsx` (não são mais stacks próprios); remover as entradas
      `<Tabs.Screen name="assinaturas" .../>` e `<Tabs.Screen name="reservas" .../>` de
      `src/app/(tabs)/_layout.tsx` — resultado final: exatamente 4 abas, "Início, Cartões, Compras,
      Mais — nesta ordem" (FR-001, FR-002)
- [ ] T029 [US3] Reescrever `src/app/(tabs)/mais/index.tsx` com 3 seções: "Planejamento" (Renda &
      Entradas → `/renda`, Assinaturas → `/mais/assinaturas`, Reservas → `/mais/reservas`),
      "Organização" (Categorias → `/mais/categorias`, Estabelecimentos → `/mais/estabelecimentos`),
      "Dados" (Backup → `/mais/backup`) — lista simples (avatar + nome + subtítulo + chevron),
      layout de referência no canvas `Mais.dc.html` citado em spec.md (FR-003)

**Checkpoint**: as três User Stories completas e testáveis de forma independente (`quickstart.md`
completo).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: validação final e qualidade transversal.

- [ ] T030 Rodar `quickstart.md` de ponta a ponta num Android real (Expo Go), incluindo a "Checagem
      de consistência entre telas" (Gastos da Início == Total gasto de Compras para o mesmo mês)
- [ ] T031 [P] Revisão final: confirmar que nenhuma lista de transação desta feature usa wrapper
      `card` com borda/fundo (FR-018) e que a visão de mês futuro não introduziu nenhum selo/banner
      além do especificado em FR-014 — conferir contra o canvas de referência citado em spec.md
- [ ] T032 Atualizar `specs/002-central-de-compras/checklists/requirements.md` com o status final
      de implementação

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: depende do Setup — BLOQUEIA as três User Stories
- **User Story 1 (Phase 3)**: depende só do Foundational
- **User Story 2 (Phase 4)**: depende do Foundational; T022/T023 também dependem de T010/T011/T013
  (US1) já existirem no arquivo `(tabs)/compras/index.tsx` que está sendo estendido
- **User Story 3 (Phase 5)**: depende só do Foundational — não depende de US1/US2 (mexe em
  arquivos completamente diferentes: `assinaturas/`, `reservas/`, `mais/`, `_layout.tsx` das abas).
  Pode ser feita em paralelo com US1/US2 por outra pessoa, mas T028 (remover as abas antigas) só
  deve rodar depois de T008 (adicionar a aba Compras) para nunca haver um instante com menos de 4
  abas navegáveis
- **Polish (Phase 6)**: depende das três User Stories completas

### Parallel Opportunities

- T002, T003, T004, T007 (Foundational) — arquivos diferentes, sem dependência entre si
- T017, T021 (US2) — arquivos diferentes
- Toda a Phase 5 (US3) pode ser feita em paralelo com as Phases 3–4 (US1/US2) por serem arquivos
  disjuntos, respeitando apenas a ordem T008 → T028 citada acima

---

## Parallel Example: Foundational

```bash
Task: "Criar src/domain/purchasesOverview/types.ts (T002)"
Task: "Implementar src/domain/purchasesOverview/groupByDay.ts (T003)"
Task: "Implementar src/domain/purchasesOverview/paymentBreakdown.ts (T004)"
Task: "Criar src/components/PaymentMethodBadge.tsx (T007)"
```

---

## Implementation Strategy

### MVP First (User Story 1 apenas)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloqueia as três stories)
3. Completar Phase 3: User Story 1
4. **PARAR e VALIDAR**: `quickstart.md` Cenário 1 num Android real
5. Esse já é um MVP útil: resolve a queixa original (transação Pix "some" do app) mesmo sem
   navegação entre meses nem a limpeza da barra de navegação

### Incremental Delivery

1. Setup + Foundational → fundação pronta
2. US1 → testar independentemente → **MVP**
3. US2 → testar independentemente (soma navegação entre meses e o mês futuro previsto)
4. US3 → testar independentemente (pode ser feita em paralelo com US1/US2 — ver Dependencies)
5. Polish

Cada story soma valor sem quebrar as anteriores.

---

## Notes

- `[P]` = arquivos diferentes, sem dependência entre si
- `[Story]` mapeia cada tarefa à sua User Story para rastreabilidade
- Toda constraint citada em `data-model.md`/`contracts/purchases-overview.md` foi reproduzida
  literalmente nas tarefas correspondentes, para não deixar a regra a critério da implementação
- Rodar `npm test` depois de cada tarefa de domínio (T003–T005, T017–T018); commitar por tarefa ou
  por grupo lógico
- Parar em cada checkpoint de story para validar antes de seguir para a próxima
- Depois de terminar, seguir a preferência já registrada do projeto: reportar ao usuário o que já
  dá pra testar no celular e o que ainda não (feedback padrão do projeto — ver memória)
