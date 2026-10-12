# Implementation Plan: "Minha parte" × Global, linha do tempo de Compras, Faturas organizadas e gráfico de gastos

**Branch**: `003-minha-parte-e-linha-do-tempo` | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-minha-parte-e-linha-do-tempo/spec.md`

## Summary

Torna coerente o uso da "parte do usuário" (`Parcela.valorResponsabilidade`, já persistida com a
responsabilidade efetiva resolvida por `resolveResponsibility`) em todo o app e reorganiza três
telas que poluem com o tempo:

- **US1**: o saldo da Início passa a somar `valorResponsabilidade` (Pix) e
  `totalResponsabilidade` (faturas); Estatísticas ganha uma `SpendingBasis` (`'minha' | 'global'`)
  que parametriza todas as funções de `domain/statistics`.
- **US2**: a tela Compras troca a unidade de listagem de **Parcela** (mês por vencimento) para
  **Compra** (mês pela `dataCompra`), revertendo deliberadamente a decisão-chave do contrato da
  feature 002 (ver research.md R1), com filtro "Só minhas" e "Sua parte" no card.
- **US3**: lista de faturas do cartão com navegação por ano (reuso de `MonthNavigator`) e pagas
  ocultas por padrão; detalhe da fatura agrupado por dia via um `groupByDay` genérico.
- **US4**: gráfico de rosca desenhado com `react-native-svg` (já dependência) + tela de
  detalhamento por categoria.

Nenhuma dependência nova, nenhuma mudança de schema/migration.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React Native via Expo SDK 57 (managed workflow).

**Primary Dependencies**: `expo-router`, Tamagui, Drizzle ORM sobre `expo-sqlite`, `date-fns`
(+ `ptBR`), `react-native-gesture-handler` (já usado por `MonthNavigator`), `react-native-svg`
15.15.4 (já em `package.json`, ainda não importado em `src/` — passa a ser usado pelo gráfico).

**Storage**: SQLite local via Drizzle; schema inalterado. Toda a feature é leitura/derivação.

**Testing**: Jest (`jest-expo`) para funções puras de `src/domain/**` em `tests/unit/domain/`
(rodar com `--testPathIgnorePatterns '/.claude/'`); verificação manual on-device (Expo Go) via
`quickstart.md` para telas, gesto e gráfico.

**Target Platform**: Android (Princípio III).

**Project Type**: Mobile app (projeto Expo único).

**Performance Goals**: troca de mês/ano/filtro/base percebida como instantânea (<150 ms) para o
volume de uso pessoal (milhares de compras); filtros Meu/Global e "Só minhas" são aplicados em
memória sobre dados já carregados, sem nova query.

**Constraints**: 100% offline (Princípio I); sem dependências novas (Princípio II); sem migration
(Princípio IV); listas planas com divisórias, cards só para números-resumo (regra de UI do projeto);
qualquer tela nova alcançável só a partir da aba Início pode ficar no stack de `inicio/` (regra de
navegação cruzada entre abas).

**Scale/Scope**: 5 telas alteradas (Início, Estatísticas, Compras, Cartão, Fatura) + 1 tela nova
(detalhamento por categoria) + 1 componente novo (`DonutChart`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|---|---|---|
| I. Offline-First | Nenhuma chamada de rede; tudo derivado do SQLite local. | ✅ |
| II. Stack fixa | Sem UI kit/ORM novo; gráfico com `react-native-svg`, que já é dependência transitiva/direta do projeto (não é "biblioteca concorrente" de UI). Nenhuma lib de gráfico adicionada. | ✅ |
| III. Android-only | Nada específico de iOS. | ✅ |
| IV. Integridade dos dados | Sem mudança de schema; backup/restore não afetados. | ✅ |
| V. YAGNI | Recortes além de categoria e persistência de preferências explicitamente fora de escopo (spec Clarifications). `SpendingBasis` é um parâmetro simples, não um framework de filtros. | ✅ |

**Re-check pós-design**: ✅ — o design (data-model/contracts) não introduziu dependências,
tabelas nem chamadas de rede.

## Project Structure

### Documentation (this feature)

```text
specs/003-minha-parte-e-linha-do-tempo/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── spending-basis.md          # US1 — statistics + saldo
│   ├── purchases-timeline.md      # US2 — Compras por dataCompra + groupByDay genérico
│   ├── card-invoices-view.md      # US3 — ano/pagas + detalhe agrupado
│   └── category-share-chart.md    # US4 — categoryShare + DonutChart + rota
├── checklists/requirements.md
└── tasks.md                       # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── domain/
│   ├── statistics/
│   │   ├── types.ts                 # + SpendingBasis, ParcelaComCompra.valor
│   │   ├── amountOf.ts              # NOVO: valor da parcela conforme a base
│   │   ├── totalSpent.ts / spendingByCategory.ts / topExpenses.ts / subscriptionsShare.ts  # + basis
│   │   └── categoryShare.ts         # NOVO (US4): top 5 + "Outras", pct
│   ├── purchasesOverview/
│   │   ├── types.ts                 # PurchaseListRow por Compra (+ valorResponsabilidade, isSplit, parcelasTotal)
│   │   ├── groupByDay.ts            # genérico sobre acessor de data, ordena desc
│   │   ├── paymentBreakdown.ts      # + totalResponsabilidade
│   │   └── filters.ts               # NOVO: applyPurchaseFilters (forma + "Só minhas")
│   └── invoices/
│       └── invoiceYearView.ts       # NOVO (US3): anos disponíveis, filtro ano/pagas
├── repositories/
│   ├── statisticsRepository.ts      # mapper com `valor`; getStatistics(kind, anchor, basis)
│   ├── purchasesRepository.ts       # listPurchasesForMonth por Compra; listPixPurchasesForMonth c/ parte; listPurchasesForInvoice ORDER BY
│   └── invoicesRepository.ts        # (sem mudança; totalResponsabilidade já exposto)
├── hooks/
│   ├── useMonthBalance.ts           # base = minha parte; ignora entradas vinculadas (FR-001a)
│   └── useStatistics.ts             # + basis
├── components/
│   ├── DonutChart.tsx               # NOVO (react-native-svg)
│   └── DayGroupHeader.tsx           # NOVO: cabeçalho de dia compartilhado Compras/Fatura
├── state/statisticsPrefs.ts         # NOVO: basis/categoryView lembrados durante a sessão
├── theme/colors.ts                  # + paleta categórica do gráfico (6 cores)
└── app/
    ├── (tabs)/inicio/index.tsx                  # subtítulo "Gastos" pela parte
    ├── (tabs)/inicio/estatisticas.tsx           # SegmentedControl Meu/Global + Lista/Gráfico
    ├── (tabs)/inicio/estatisticas-categorias.tsx # NOVO: detalhamento
    ├── (tabs)/inicio/_layout.tsx                # registra a rota nova
    ├── (tabs)/compras/index.tsx                 # chip "Só minhas", card com "Sua parte", selo "Nx"
    ├── cartao/[cardId]/index.tsx                # navegador de ano + mostrar/ocultar pagas
    └── cartao/[cardId]/fatura/[invoiceId].tsx   # agrupado por dia

tests/unit/domain/
├── statistics.test.ts         # + basis global / categoryShare
├── cashflow.test.ts           # saldo com partes
├── purchasesOverview.test.ts  # groupByDay genérico, filtros, breakdown c/ parte
└── invoices.test.ts           # invoiceYearView
```

**Structure Decision**: projeto Expo único existente; lógica nova em funções puras de
`src/domain/**` (testáveis sem SQLite), repositórios só fazem query/mapeamento, telas só compõem.

## Complexity Tracking

Sem violações da constituição — seção não aplicável.
