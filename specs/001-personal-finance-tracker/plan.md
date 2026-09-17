# Implementation Plan: Controle Financeiro Pessoal — Núcleo (Cartões, Fluxo de Caixa, Assinaturas e Reservas)

**Branch**: `001-personal-finance-tracker` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-personal-finance-tracker/spec.md`

## Summary

App de controle financeiro pessoal, 100% offline, sem login, Android-only, para uso individual.
Cobre cadastro de cartões com cálculo automático de fatura (fechamento/vencimento), parcelamento
automático — inclusive de compras já em andamento antes da adoção do app —, sugestão do melhor
cartão para uma compra hoje, fluxo de caixa mensal (renda + entradas avulsas + Pix), assinaturas
recorrentes geradas automaticamente, reservas de dinheiro guardado com rendimento manual e taxa
configurável (aplicação automática é feature futura, apenas o schema antecipa), importação de
fatura via CSV (genérico e Nubank), categorias e estabelecimentos com avatar (incluindo busca
opcional e não-bloqueante de logotipo via Brandfetch), painel de estatísticas por período, divisão
de responsabilidade em compras compartilhadas (User Story 12), e backup/restauração local completa.

Abordagem técnica: Expo (managed workflow) + TypeScript + Tamagui para UI, Drizzle ORM sobre
`expo-sqlite` para persistência local, com toda a regra de negócio ("engines" de fatura,
parcelamento, assinatura, melhor cartão, estatísticas, divisão de responsabilidade, matching de
estabelecimento, parsers de CSV) implementada como módulos de domínio puros (TypeScript sem
dependência de React Native), testáveis isoladamente com Jest, e consumidos por uma camada fina de
repositórios Drizzle e hooks React.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React Native via Expo SDK atual (managed
workflow), Node.js 20 LTS como toolchain de desenvolvimento.

**Primary Dependencies**: Expo + `expo-router` (navegação por arquivo, alinhada às 6 telas/canvases
já desenhadas), Tamagui (`@tamagui/core`, `@tamagui/config`) para UI, Drizzle ORM (`drizzle-orm` +
`drizzle-kit`) sobre `expo-sqlite`, `lucide-react-native` + `react-native-svg` (confirmado com o
usuário) para ícones, `date-fns` para aritmética de datas (fechamento/vencimento/clamp de mês
curto), `react-hook-form` + `zod` para formulários e validação (cartão, compra, assinatura,
reserva), `papaparse` para parsing de CSV, `expo-file-system` + `expo-sharing` +
`expo-document-picker` para exportar/importar o arquivo de backup e para o upload do CSV,
`expo-crypto` (`randomUUID`) para geração de IDs.

**Storage**: SQLite local via `expo-sqlite`, acessado exclusivamente através de Drizzle ORM.
Nenhum armazenamento remoto ou serviço de sincronização (Princípio I da constituição).

**Testing**: Jest (`jest-expo` preset) + `@testing-library/react-native` para componentes; toda a
lógica de negócio crítica (motor de fatura, parcelamento, sugestão de melhor cartão, parsers de
CSV, motor de estatísticas, divisão de responsabilidade, matching de estabelecimento) vive em
módulos de domínio puros e é coberta por testes unitários Jest comuns, sem precisar de um device ou
runtime SQLite real (ver `research.md` — Decisão: Estratégia de testes).

**Target Platform**: Android (managed Expo / Expo Go para desenvolvimento; build de produção via
EAS Build quando necessário). iOS explicitamente fora de escopo (Princípio III).

**Project Type**: Mobile app (projeto único Expo — não há backend/API separado).

**Performance Goals**: Abertura do app e migrations do SQLite completando em menos de ~500ms para
o volume de dados esperado (uso pessoal, milhares de compras/parcelas no máximo); listagens e
cálculos de fatura/estatística devem ser percebidos como instantâneos (<100ms) para esse volume,
sem paginação sofisticada sendo necessária nesta fase.

**Constraints**: 100% funcional offline (Princípio I); nenhuma chamada de rede pode bloquear ou ser
pré-requisito de qualquer tela — a única exceção é a busca best-effort de logotipo via Brandfetch
(FR-036), sempre em background, sempre com fallback local e cache; nenhuma telemetria/analytics
remota (restrição de stack); sem login/autenticação em nenhuma tela.

**Scale/Scope**: Um único usuário, um único dispositivo Android; ~19 telas mapeadas em
`design-brief.md` através de 6 canvases; dezenas de cartões/estabelecimentos e centenas a poucos
milhares de compras/parcelas ao longo de anos de uso — não milhões de registros.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Offline-First | PASS. Toda funcionalidade essencial roda 100% local via `expo-sqlite`. A única integração de rede (busca de logotipo Brandfetch, FR-036) é opcional, best-effort, cacheada, nunca bloqueante e nunca pré-requisito — conforme a exceção explícita do Princípio I (v1.1.0). Nenhuma outra chamada de rede é introduzida neste plano. |
| II. Stack Tecnológica Fixa | PASS. Expo + Tamagui + Drizzle + `expo-sqlite` são exatamente a stack fixada; nenhuma biblioteca concorrente (outro UI kit, outro ORM, outro driver de banco) é introduzida. |
| III. Android-Only | PASS. Nenhuma decisão de arquitetura, navegação ou empacotamento depende de iOS; `expo-router` e as libs escolhidas são multiplataforma por padrão, mas nada é construído especificamente para iOS. |
| IV. Integridade e Portabilidade dos Dados | PASS. Migrations do Drizzle são versionadas e aplicadas no boot (`drizzle-kit generate` + `migrate()` antes de renderizar a navegação). Backup/restauração local (FR-023, FR-024) é tratado como entidade de primeira classe no `data-model.md` e no `contracts/backup.md`, não como extra. |
| V. Simplicidade e Escopo Enxuto (YAGNI) | PASS. Nenhuma integração bancária real, sincronização multi-dispositivo ou motor de automação em background 24/7 é introduzida. O rendimento automático de reservas (FR-021) permanece apenas no schema (`YieldRateConfig`/campo de taxa), sem job de execução — conforme a Assumption explícita da spec. |

Nenhuma violação a justificar em Complexity Tracking.

**Re-check pós-Fase 1 (design)**: `research.md`, `data-model.md` e `contracts/*` não introduziram
nenhuma dependência, integração de rede ou padrão de persistência fora do já avaliado acima — a
única chamada de rede (`domain` não faz fetch nenhum; o fetch do logotipo Brandfetch fica isolado
na camada de repositório/hook de Estabelecimento) continua best-effort, cacheada e não-bloqueante.
Gate mantém-se PASS sem exceções.

## Project Structure

### Documentation (this feature)

```text
specs/001-personal-finance-tracker/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
├── design-brief.md      # Handoff visual (Claude Design canvases) — já existente
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Projeto Expo único (sem frontend/backend separados — não há API remota, ver Constitution Check
Princípio I). Estrutura de pastas:

```text
app/                          # expo-router — uma rota por tela do design-brief.md
├── _layout.tsx                # boot: roda migrations do Drizzle antes de montar a navegação
├── (tabs)/
│   ├── index.tsx               # Início & Estatísticas · Main
│   ├── estatisticas.tsx         # Início & Estatísticas · Estatisticas
│   ├── cartoes/
│   │   ├── index.tsx            # Cartões · Main
│   │   ├── [cardId]/index.tsx    # Cartão · Faturas (CartaoDetalhe)
│   │   ├── [cardId]/fatura/[invoiceId].tsx  # Fatura · Detalhe
│   │   └── nova-compra/
│   │       ├── index.tsx          # Nova Compra
│   │       ├── categoria.tsx       # drawer de categoria
│   │       ├── estabelecimento.tsx # criar estabelecimento inline
│   │       ├── divisao-manual.tsx  # User Story 12 — divisão manual
│   │       └── divisao-vinculada.tsx # User Story 12 — divisão por entrada vinculada
│   ├── renda/
│   │   ├── index.tsx             # Renda & Entradas · Main (+ MesVazio como estado vazio)
│   │   ├── historico.tsx          # aba Histórico
│   │   └── nova-entrada.tsx        # EntradaAvulsaNova
│   ├── assinaturas/
│   │   ├── index.tsx
│   │   └── [subscriptionId].tsx    # AssinaturaEditar
│   ├── importar-csv/
│   │   ├── index.tsx
│   │   └── resultado.tsx
│   ├── categorias/
│   │   ├── index.tsx
│   │   └── nova.tsx
│   ├── estabelecimentos/
│   │   ├── index.tsx
│   │   └── [establishmentId].tsx
│   ├── reservas/
│   │   ├── index.tsx
│   │   └── [reserveId].tsx
│   └── backup/
│       ├── index.tsx
│       └── confirmar-restauracao.tsx
├── db/
│   ├── schema.ts                 # tabelas Drizzle (uma seção por Key Entity da spec)
│   ├── client.ts                 # abre o expo-sqlite db + injeta o Drizzle
│   └── migrations/                # gerado por `drizzle-kit generate`, empacotado como asset Metro
├── domain/                       # regra de negócio pura (sem import de React/RN/Drizzle)
│   ├── invoices/                  # FR-002, FR-011 — em qual fatura uma data cai; total da fatura
│   ├── installments/              # FR-004..FR-006 — split de parcelas, parcela-atual em andamento
│   ├── bestCard/                  # FR-012 — ranking de prazo até vencimento
│   ├── subscriptions/             # FR-016..FR-018 — geração mensal idempotente
│   ├── expenseSplitting/          # FR-046..FR-055 — User Story 12
│   ├── statistics/                # FR-038..FR-045 — agregações por período
│   ├── establishmentMatching/     # FR-031..FR-035 — matching por padrão/slug, desempate
│   ├── csvImport/
│   │   ├── genericParser.ts
│   │   └── nubankParser.ts
│   └── backup/                    # FR-023, FR-024 — serialização/versão/restauração
├── repositories/                  # camada fina de queries Drizzle, 1 arquivo por Key Entity
├── hooks/                         # hooks React que combinam repositories + domain (ex.: useInvoice)
├── components/                    # componentes Tamagui reutilizáveis (avatar, chip de parcela, ...)
├── theme/                         # tamagui.config.ts com os tokens definidos no design-brief.md
└── assets/                        # fontes (Manrope/Lora), ícones de categoria/estabelecimento padrão

tests/
├── unit/                          # 1:1 com src/domain/** — sem device, sem SQLite real
├── integration/                   # repositories + migrations rodando em runtime Expo (Detox/on-device)
└── fixtures/                      # CSVs de exemplo (genérico e Nubank) usados nos parsers e no quickstart
```

**Structure Decision**: Projeto Expo único (Option 1 adaptada para mobile — sem `src/` genérico
porque `expo-router` exige a pasta `app/` na raiz para roteamento por arquivo). Toda regra de
negócio fica em `domain/`, deliberadamente desacoplada de React Native e do Drizzle, para poder ser
testada com Jest puro sem depender de um runtime SQLite real (ver `research.md`). `repositories/` é
a única camada que conhece `expo-sqlite`/Drizzle; `hooks/` é a única camada que conhece React.

## Complexity Tracking

*Sem violações à Constitution Check — seção não aplicável.*
