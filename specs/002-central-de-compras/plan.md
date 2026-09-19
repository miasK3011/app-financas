# Implementation Plan: Central de Compras e Navegação Simplificada

**Branch**: `002-central-de-compras` | **Date**: 2026-09-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-central-de-compras/spec.md`

## Summary

Reduz a navegação principal de 5 para 4 abas (Início, Cartões, Compras, Mais), movendo Assinaturas
e Reservas para dentro de "Mais" (agora organizada em seções), e introduz uma nova aba "Compras" que
agrega TODAS as compras do usuário — cartão e Pix — por mês, com navegador de mês (setas + swipe),
resumo com divisão por forma de pagamento, filtro rápido, lista agrupada por dia (mês corrente/
passado) ou por fatura (mês futuro com parcela já lançada). Escopo explicitamente não inclui
"Dinheiro" como forma de pagamento (decisão do usuário — ver spec.md, Assumptions).

Abordagem técnica: nenhuma dependência nova. A feature é, sobretudo, uma nova tela de agregação de
leitura sobre dados que já existem (`Compra`, `Parcela`, `Fatura`), mais reorganização de rotas do
`expo-router`. O gesto de swipe usa `react-native-gesture-handler`/`react-native-reanimated`, já
presentes no projeto (usados por Tamagui/navegação).

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React Native via Expo SDK atual (managed
workflow) — mesma base do projeto (feature 001).

**Primary Dependencies**: `expo-router` (reorganização de rotas), Tamagui (UI, reuso de tokens/
componentes já definidos), Drizzle ORM sobre `expo-sqlite` (leitura), `date-fns` (aritmética de mês/
ano para o navegador de mês), `react-native-gesture-handler` + `react-native-reanimated` (gesto de
swipe no navegador de mês) — todas já dependências do projeto; nenhuma biblioteca nova é introduzida.

**Storage**: SQLite local via `expo-sqlite`/Drizzle, mesmo schema já existente (`Compra`, `Parcela`
implícita via `Fatura`+`Compra.parcelasTotal/parcelaAtual`, `Fatura`, `Cartão`). Nenhuma migration de
schema é necessária — esta feature é somente leitura/agregação sobre dados existentes (ver spec.md
FR-020: Dinheiro fora de escopo, que seria a única mudança de schema).

**Testing**: Jest (`jest-expo`) para a lógica de agregação por mês (módulo de domínio puro:
determinar o intervalo de meses navegáveis, agrupar compras por dia/fatura, calcular a divisão por
forma de pagamento) — sem device nem SQLite real, seguindo o padrão já estabelecido em
`src/domain/**`. Testes de integração leves nos repositórios (query real contra `expo-sqlite`) e uma
verificação manual on-device do gesto de swipe (não é prático testar gestos de touch via Jest).

**Target Platform**: Android (mesma plataforma única do projeto; Princípio III da constituição).

**Project Type**: Mobile app — mesmo projeto Expo único do restante do app (sem API/backend).

**Performance Goals**: Trocar de mês (seta ou swipe) deve refletir na tela em menos de ~150ms
percebidos, sem novo carregamento de tela — mesmo padrão de "instantâneo" já usado nas outras telas
do app para o volume de dados esperado (uso pessoal, no máximo alguns milhares de compras/parcelas).

**Constraints**: 100% offline (Princípio I) — toda a agregação é local, sem chamada de rede; nenhuma
dependência nova é introduzida (Princípio II); nenhuma mudança de schema (Princípio IV — esta feature
não toca en migrations).

**Scale/Scope**: 4 telas novas/alteradas de navegação (`Compras` nova; `Início`, `Mais` e a barra de
abas alteradas) + 2 telas existentes apenas realocadas de rota (`Assinaturas`, `Reservas`, sem mudança
de comportamento interno).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Offline-First | PASS. A tela Compras só lê dados já persistidos localmente via Drizzle/`expo-sqlite`; nenhuma chamada de rede é introduzida. |
| II. Stack Tecnológica Fixa | PASS. Nenhuma dependência nova — reutiliza Expo Router, Tamagui, Drizzle e as libs de gesto (`react-native-gesture-handler`/`reanimated`) já presentes no `package.json`. |
| III. Android-Only | PASS. Nenhuma decisão específica de plataforma além do que já existe no projeto. |
| IV. Integridade e Portabilidade dos Dados | PASS. Nenhuma migration de schema — feature somente-leitura/agregação. A exclusão explícita de "Dinheiro" (spec.md FR-020) evita justamente uma migration não planejada nesta rodada. |
| V. Simplicidade e Escopo Enxuto (YAGNI) | PASS. Escopo explicitamente cortado para não incluir "Dinheiro" como forma de pagamento nem nenhuma automação nova — reorganiza navegação e agrega dados existentes, nada além disso. |

Nenhuma violação a justificar em Complexity Tracking.

**Re-check pós-Fase 1 (design)**: `data-model.md` e `contracts/` (abaixo) confirmam que nenhuma
tabela nova é criada e nenhuma coluna é alterada — apenas novas funções de leitura/agregação em
`src/repositories/` e `src/domain/`. Gate mantém-se PASS sem exceções.

## Project Structure

### Documentation (this feature)

```text
specs/002-central-de-compras/
├── plan.md              # This file (/speckit-plan command output)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

Mesmo projeto Expo único do restante do app (`src/`, convenção já estabelecida na feature 001).
Alterações desta feature, em relação à árvore atual:

```text
src/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx          # ALTERADO: 4 abas (inicio, cartoes, compras, mais);
│   │   │                          remove Tabs.Screen "assinaturas" e "reservas"
│   │   ├── inicio/
│   │   │   └── index.tsx          # ALTERADO: link "Ver tudo" ao lado de "Transações
│   │   │                            recentes", navega para a aba Compras (mês corrente)
│   │   ├── compras/                # NOVO — aba Compras
│   │   │   ├── _layout.tsx          # Stack desta aba (só a raiz por enquanto)
│   │   │   └── index.tsx            # navegador de mês, resumo, filtro, lista
│   │   │                            (por dia ou por fatura, conforme o mês exibido)
│   │   └── mais/
│   │       ├── index.tsx            # ALTERADO: seções Planejamento (Renda,
│   │       │                          Assinaturas, Reservas) / Organização
│   │       │                          (Categorias, Estabelecimentos) / Dados (Backup)
│   │       ├── assinaturas/          # MOVIDO de (tabs)/assinaturas/ (mesmas telas,
│   │       │   ├── index.tsx           # nenhuma mudança de comportamento interno)
│   │       │   └── [subscriptionId].tsx
│   │       └── reservas/             # MOVIDO de (tabs)/reservas/ (idem)
│   │           ├── index.tsx
│   │           └── [reserveId].tsx
├── domain/
│   └── purchasesOverview/           # NOVO — módulo de domínio puro (sem Drizzle/React)
│       ├── monthRange.ts             # calcula o mês mais antigo/mais recente navegável
│       │                            (mais recente = último mês com Parcela lançada;
│       │                             mais antigo = mês da Compra mais antiga)
│       ├── groupByDay.ts             # agrupa uma lista de compras do mês por dia
│       │                            ("Hoje"/"Ontem"/data), já ordenadas
│       └── paymentBreakdown.ts       # soma total + total por forma de pagamento
│                                    (Cartão/Pix) a partir de uma lista de compras
├── repositories/
│   └── purchasesRepository.ts       # ALTERADO: nova função
│                                    `listPurchasesForMonth(year, month)` combinando
│                                    compras no cartão (via Parcela/Fatura) e Pix
│                                    (reaproveita `listPixPurchasesForMonth`) num
│                                    único formato de linha compatível com a lista
└── components/
    └── MonthNavigator.tsx           # NOVO — componente reutilizável: setas +
                                    label centralizado + PanGestureHandler de swipe
```

Nenhuma pasta de `db/`, `migrations/` ou `theme/` é alterada.

**Structure Decision**: Segue exatamente a convenção já estabelecida na feature 001 (`src/app` para
rotas do `expo-router`, `domain`/`repositories`/`components` como pastas irmãs fora do roteador). A
aba Compras é um tab root de primeira classe — não um screen aninhado dentro de outra aba — então o
link "Ver tudo" da Início para Compras é uma troca de aba normal do `expo-router` e não incorre no
bug de navegação cross-tab já documentado (ver memória do projeto): esse bug só afeta uma tela
NÃO-raiz de uma aba que também é aberta a partir de outra aba, o que não é o caso aqui. Assinaturas e
Reservas, ao deixarem de ser abas, passam a viver aninhadas dentro da aba Mais — seguro porque,
confirmado por busca no código, nenhuma outra tela navega diretamente para essas rotas hoje (só as
próprias abas), então não há nenhum ponto de entrada cross-tab restante para elas.

## Complexity Tracking

*Sem violações à Constitution Check — seção não aplicável.*
