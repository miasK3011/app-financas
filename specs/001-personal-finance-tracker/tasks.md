---

description: "Task list for Controle Financeiro Pessoal — Núcleo"
---

# Tasks: Controle Financeiro Pessoal — Núcleo (Cartões, Fluxo de Caixa, Assinaturas e Reservas)

**Input**: Design documents from `/specs/001-personal-finance-tracker/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (all present)

**Tests**: Incluídas para toda a lógica de `src/domain/**`, conforme a estratégia de testes definida
em `research.md` (Decisão: Estratégia de testes sem backend/API) — não são testes de UI/e2e, que
ficam cobertos pela validação manual de `quickstart.md`.

**Organization**: Tarefas agrupadas por User Story (spec.md), em ordem de prioridade (P1 → P2 → P3),
respeitando as dependências entre stories declaradas na própria spec ("Why this priority").

> Revisado após `/speckit-analyze` (2026-09-17): 4 tarefas adicionadas e 5 reformulações de texto
> para fechar lacunas de cobertura (criação de Tag — FR-007; dispatcher único da precedência de
> responsabilidade — FR-046–055; fluxo de criação de Assinatura/Reserva/Estabelecimento; ação de
> arquivar cartão na UI; associação manual de estabelecimento em transação existente — FR-034).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: A qual User Story a tarefa pertence (US1..US12)
- Caminhos de arquivo exatos em cada descrição, conforme `plan.md` → Project Structure

## Path Conventions

Projeto Expo único (mobile, sem backend separado — ver `plan.md`): `src/app/` (rotas `expo-router`),
com `src/domain/` + `src/db/` + `src/repositories/` + `src/hooks/` + `src/components/` +
`src/theme/` como pastas irmãs dentro de `src/`, fora do alcance do roteador; `tests/` na raiz.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialização do projeto Expo e ferramentas compartilhadas.

- [X] T001 Inicializar projeto Expo (TypeScript, template `default` do `create-expo-app`, que já
      gera `src/app/` com `expo-router`) na raiz do repositório, mesclando o scaffold com o
      repositório existente sem sobrescrever `specs/`, `design/`, `.specify/`, `.gitignore` ou
      `.claude/` já existentes; criar `tests/` conforme `plan.md` → Project Structure
- [X] T002 [P] Instalar e configurar Tamagui (`tamagui`, `@tamagui/core`, `@tamagui/config`);
      criar `src/theme/tamagui.config.ts` com os tokens de `design-brief.md` §3.1 (cores
      `--color-primary #2E6F55`, `--color-error #C74A3C`, `--color-info #2F6FB0`, raios `20px`/`14px`,
      fontes Manrope + Lora via Google Fonts)
- [X] T003 [P] Instalar Drizzle ORM (`drizzle-orm`, `drizzle-kit`, `expo-sqlite`); criar
      `drizzle.config.ts` na raiz (dialect `sqlite`, schema `src/db/schema.ts`,
      out `src/db/migrations`)
- [X] T004 [P] Instalar as demais dependências de `research.md` → Resumo de dependências:
      `lucide-react-native`, `react-native-svg`, `date-fns`, `react-hook-form`, `zod`, `papaparse`,
      `expo-file-system`, `expo-sharing`, `expo-document-picker`, `expo-crypto`
- [X] T005 [P] Configurar ESLint + Prettier + `tsconfig.json` em modo `strict: true`
- [X] T006 [P] Configurar Jest (`jest-expo` preset) + `@testing-library/react-native`; criar
      `tests/unit/`, `tests/integration/`; adicionar script `npm test`
- [X] T007 Criar o esqueleto de rotas `expo-router` conforme a árvore corrigida em `plan.md` →
      Project Structure: `src/app/_layout.tsx` (stack raiz) e `src/app/(tabs)/_layout.tsx` (Tabs
      navigator com as 5 abas da barra inferior: **inicio, cartoes, assinaturas, reservas, mais**),
      cada aba com seu próprio `_layout.tsx` (Stack) e uma tela placeholder vazia para cada uma das
      rotas de tela do design-brief.md + a tela de menu `mais/index.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema do banco, migrations, boot do app e utilitários compartilhados por todas as
User Stories.

**⚠️ CRITICAL**: Nenhuma User Story pode começar antes desta fase estar completa.

- [X] T008 [P] Implementar `src/domain/shared/money.ts`: conversão reais↔centavos e
      `formatBRL(cents: number): string`
- [X] T009 [P] Implementar `src/domain/shared/dateClamp.ts`: `clampDayToMonth(day, year, month):
      Date`, cobrindo o Edge Case "dia de fechamento/vencimento/cobrança configurado além do
      último dia de um mês mais curto ajusta automaticamente para o último dia válido daquele mês"
- [X] T010 Definir a tabela `Cartão` em `src/db/schema.ts`: `id` (text PK, uuid), `nome` (text not
      null), `diaFechamento`/`diaVencimento` (integer not null, **1–31**), `arquivadoEm` (integer
      nullable — `NULL` = ativo), `criadoEm` (integer not null), conforme `data-model.md`
- [X] T011 [P] Definir a tabela `Fatura` em `src/db/schema.ts`: campos conforme `data-model.md`,
      **único por `(cartaoId, referenciaAno, referenciaMes)`**, `status` enum
      `ABERTA | FECHADA | PAGA`
- [X] T012 [P] Definir a tabela `Compra` em `src/db/schema.ts` com todos os campos de
      `data-model.md`, incluindo `valorResponsabilidade` (integer nullable), `motivo`/`responsavel`
      (text nullable), `estabelecimentoManual` (boolean not null default false), `origem` enum
      `MANUAL | CSV_IMPORT | ASSINATURA`, e a validação **`1 ≤ parcelaAtual ≤ parcelasTotal`**
      expressa como schema `zod` companion em `src/domain/shared/purchaseSchema.ts`
- [X] T013 [P] Definir a tabela `Parcela` em `src/db/schema.ts`: `faturaId` (text FK **nullable** —
      `NULL` quando a Compra é PIX), `numero`, `valor`, `valorResponsabilidade`, conforme
      `data-model.md`
- [X] T014 [P] Definir as tabelas `Tag` (nome **UNIQUE**) e `CompraTag` (PK composta
      `compraId`+`tagId`) em `src/db/schema.ts`
- [X] T015 [P] Definir as tabelas `Assinatura` e `AssinaturaTag` em `src/db/schema.ts` conforme
      `data-model.md`
- [X] T016 [P] Definir a tabela `ConfiguracaoRenda` em `src/db/schema.ts` (histórico por
      `vigenteDesde`, nunca reescrito)
- [X] T017 [P] Definir a tabela `EntradaAvulsa` em `src/db/schema.ts`, com `compraVinculadaId`
      (text FK nullable → Compra)
- [X] T018 [P] Definir as tabelas `Reserva` e `LancamentoReserva` em `src/db/schema.ts` —
      `LancamentoReserva.tipo` enum `DEPOSITO | RETIRADA | RENDIMENTO_MANUAL |
      RENDIMENTO_AUTOMATICO` (o último reservado para a feature futura; nenhum código o gera ainda)
- [X] T019 [P] Definir a tabela `LoteImportacao` em `src/db/schema.ts`
- [X] T020 [P] Definir a tabela `Categoria` em `src/db/schema.ts` (`predefinida` boolean not null)
- [X] T021 [P] Definir as tabelas `Estabelecimento` e `PadraoReconhecimento` em `src/db/schema.ts`
- [X] T022 [P] Definir a tabela singleton `MetaConsumoIdeal` em `src/db/schema.ts`
      (`percentualDaRenda` real not null)
- [X] T023 Rodar `npx drizzle-kit generate` para produzir a migration inicial em
      `src/db/migrations/`; conferir as 15 tabelas geradas contra `data-model.md`
- [X] T024 Implementar `src/db/client.ts`: abrir o banco `expo-sqlite`, envolver com `drizzle()`,
      exportar a instância `db` tipada
- [X] T025 Implementar o gate de migration no boot em `src/app/_layout.tsx` usando `useMigrations` de
      `drizzle-orm/expo-sqlite/migrator`, exibindo uma tela de loading até concluir — nenhuma
      navegação é montada antes disso (`research.md` → Decisão: Migrations no boot)
- [X] T026 Implementar o seed das Categorias pré-definidas (Compras, Transporte, Alimentação,
      Assinaturas, Saúde, Lazer, **Outros**) rodando uma vez após as migrations, se a tabela
      `Categoria` estiver vazia; `Outros` sempre com `predefinida = true` e nunca excluível
- [X] T027 Aplicar os tokens do tema Tamagui no shell do app (`TamaguiProvider` em
      `src/app/_layout.tsx`), carregando Manrope + Lora via `expo-font`

**Checkpoint**: Fundação pronta — as User Stories podem começar.

---

## Phase 3: User Story 1 - Cadastrar cartões e ver o valor certo da fatura (Priority: P1) 🎯 MVP

**Goal**: Cadastro de cartões com fechamento/vencimento e cálculo automático de em qual fatura cada
compra cai (FR-001, FR-002, FR-011).

**Independent Test**: `quickstart.md` → Cenário 1.

### Tests for User Story 1

- [X] T028 [P] [US1] Testes unitários de `resolveInvoicePeriod` em
      `tests/unit/domain/invoices.test.ts`: compra antes do fechamento cai no ciclo atual; compra
      **no dia exato do fechamento** cai no ciclo que fecha **naquele mesmo dia** (não no seguinte);
      compra um dia após o fechamento cai no ciclo seguinte (FR-002, cenários 1–3 da User Story 1)
- [X] T029 [P] [US1] Testes unitários de `computeInvoiceStatus` e `computeInvoiceTotals` em
      `tests/unit/domain/invoices.test.ts`

### Implementation for User Story 1

- [X] T030 [US1] Implementar `src/domain/invoices/resolveInvoicePeriod.ts` conforme
      `contracts/invoices.md`
- [X] T031 [US1] Implementar `src/domain/invoices/computeInvoiceDates.ts` (cálculo puro de
      `dataFechamento`/`dataVencimento` para um `(cardId, year, month)` — o upsert em si fica em
      `invoicesRepository.getOrCreateInvoice`, T034) conforme `contracts/invoices.md`
- [X] T032 [US1] Implementar `src/domain/invoices/computeInvoiceStatus.ts` e
      `src/domain/invoices/computeInvoiceTotals.ts` conforme `contracts/invoices.md` (FR-011)
- [X] T033 [P] [US1] Implementar `src/repositories/cardsRepository.ts`: criar/listar/arquivar
      Cartão, validando `diaFechamento`/`diaVencimento` entre 1 e 31
- [X] T034 [US1] Implementar `src/repositories/invoicesRepository.ts`: `getOrCreateInvoice`,
      `listInvoicesForCard`, `markInvoiceAsPaid`, agregando totais via `computeInvoiceTotals`
- [X] T035 [US1] Implementar `src/repositories/purchasesRepository.ts` (versão mínima): criar uma
      Compra à vista no cartão (1 parcela, sem parcelamento — estendido na US4), associando-a à
      fatura correta via `resolveInvoicePeriod` + `ensureInvoice`
- [X] T036 [P] [US1] Implementar os hooks `src/hooks/useCards.ts` e `src/hooks/useInvoice.ts`
- [X] T037 [US1] Construir `src/app/(tabs)/cartoes/index.tsx` (Cartões · Main) conforme
      `design-brief.md` §5 e `design/cartoes-e-compra/Main.dc.html`: lista de cartões, card
      "Total das faturas abertas", FAB "+" para novo cartão
- [X] T038 [US1] Construir o formulário de novo cartão (`react-hook-form` + `zod`): nome,
      diaFechamento (1–31), diaVencimento (1–31)
- [X] T039 [US1] Construir `src/app/(tabs)/cartoes/[cardId]/index.tsx` (Cartão · Faturas) conforme
      `CartaoDetalhe.dc.html`: lista de faturas com badge de status distinto para "Aberta"
      (`--color-info`/`--color-info-dark`); incluir a ação **"Arquivar cartão"** (com confirmação),
      chamando `cardsRepository.archiveCard` — o cartão some das opções de nova compra e da
      sugestão de melhor cartão, mas continua exibindo suas faturas (FR-025)
- [X] T040 [US1] Construir `src/app/(tabs)/cartoes/[cardId]/fatura/[invoiceId].tsx` (Fatura · Detalhe)
      conforme `FaturaDetalhe.dc.html`: valor total, lista de compras da fatura, botão "Marcar
      fatura como paga" chamando `markInvoiceAsPaid`

**Checkpoint**: User Story 1 completa e testável de forma independente (`quickstart.md` Cenário 1).

---

## Phase 4: User Story 2 - Acompanhar o saldo do mês (Priority: P1)

**Goal**: Renda mensal + entradas avulsas + compras Pix compondo o saldo do mês (FR-013 a FR-015).

**Independent Test**: `quickstart.md` → Cenário 2.

### Tests for User Story 2

- [X] T041 [P] [US2] Testes unitários de `computeMonthBalance` em
      `tests/unit/domain/cashflow.test.ts`, cobrindo os 3 cenários de aceite da User Story 2

### Implementation for User Story 2

- [X] T042 [P] [US2] Implementar `src/repositories/incomeConfigRepository.ts`:
      `setIncome(valor, vigenteDesde)`, `getIncomeForMonth(year, month)` (retorna o valor de maior
      `vigenteDesde` ≤ início do mês, sem reescrever histórico — FR-013)
- [X] T043 [P] [US2] Implementar `src/repositories/cashEntriesRepository.ts`: CRUD de EntradaAvulsa
- [X] T044 [US2] Estender `src/repositories/purchasesRepository.ts` para suportar forma de
      pagamento PIX (Parcela sem `faturaId`, contando pela `dataCompra` — nota de `data-model.md`)
- [X] T045 [US2] Implementar `src/domain/cashflow/computeMonthBalance.ts`: saldo = renda vigente +
      soma(EntradaAvulsa do mês) − soma(Parcela PIX do mês) − soma(Fatura que vence no mês) (FR-015)
- [X] T046 [P] [US2] Implementar os hooks `src/hooks/useIncome.ts` e `src/hooks/useMonthBalance.ts`
- [X] T047 [US2] Construir `src/app/(tabs)/mais/renda/index.tsx` (Renda & Entradas · Main, incluindo o
      estado vazio de `MainMesVazio.dc.html`): renda configurável, lista de entradas avulsas do
      mês, saldo do mês em destaque
- [X] T048 [US2] Construir `src/app/(tabs)/mais/renda/nova-entrada.tsx` (EntradaAvulsaNova): formulário de
      nova entrada avulsa (descrição, valor, data)
- [X] T049 [US2] Construir `src/app/(tabs)/mais/renda/historico.tsx` (aba Histórico, `MainHistorico.dc.html`)
      com o histórico de valores de renda ao longo do tempo

**Checkpoint**: User Stories 1 e 2 ambas funcionais e testáveis de forma independente.

---

## Phase 5: User Story 4 - Comprar parcelado, inclusive em andamento (Priority: P1)

**Goal**: Divisão automática do valor entre faturas futuras, incluindo compras cujo parcelamento já
estava em andamento antes da adoção do app (FR-004 a FR-006, FR-008).

**Independent Test**: `quickstart.md` → Cenário 3.

### Tests for User Story 4

- [X] T050 [P] [US4] Testes unitários de `splitInstallments` em
      `tests/unit/domain/installments.test.ts`: split simples (R$300/3x), parcela atual > 1
      (gera só as parcelas restantes), erro quando **`parcelaAtual > parcelasTotal`** ou
      **`parcelaAtual < 1`** (FR-005), diferença de arredondamento absorvida pela primeira parcela
      gerada
- [X] T051 [P] [US4] Testes unitários de `allocateInstallmentsToInvoices` em
      `tests/unit/domain/installments.test.ts`

### Implementation for User Story 4

- [X] T052 [US4] Implementar `src/domain/installments/splitInstallments.ts` conforme
      `contracts/installments.md`, incluindo `InvalidInstallmentError` para a validação FR-005
- [X] T053 [US4] Implementar `src/domain/installments/allocateInstallmentsToInvoices.ts` conforme
      `contracts/installments.md`
- [X] T054 [US4] Estender `src/repositories/purchasesRepository.ts`: ao criar uma Compra `CARTAO`
      com `parcelasTotal > 1`, chamar `splitInstallments` + `allocateInstallmentsToInvoices`,
      garantindo (via `ensureInvoice`) que cada Fatura futura necessária exista antes de inserir a
      Parcela correspondente
- [X] T055 [P] [US4] Implementar `src/repositories/tagsRepository.ts`: criar uma Tag (nome
      **UNIQUE**, conforme `data-model.md`) e listar as Tags existentes — cobre FR-007 ("criar
      tags personalizadas"), capacidade distinta da simples persistência do vínculo `CompraTag`
      (T056)
- [X] T056 [US4] Implementar a persistência de tags/comentário compartilhados: `CompraTag` é
      gravado uma única vez por Compra, reaproveitando `tagsRepository` (T055) para resolver ou
      criar cada Tag pelo nome — todas as Parcelas herdam via `compraId`, nunca por parcela (FR-008)
- [X] T057 [US4] Construir `src/app/(tabs)/cartoes/nova-compra/index.tsx` (Nova Compra) conforme
      `NovaCompra.dc.html`: descrição, valor total, data, forma de pagamento, cartão,
      `parcelasTotal`, `parcelaAtual` (opcional, default 1), tags (com opção de criar uma nova tag
      inline via `tagsRepository` quando o texto digitado não corresponder a nenhuma existente),
      comentário — validação `zod` reaproveitando as regras de `splitInstallments`
- [X] T058 [US4] Construir `src/app/(tabs)/cartoes/nova-compra/categoria.tsx` (drawer de categoria)
      conforme `NovaCompraCategoria.dc.html`
- [X] T059 [US4] Implementar a regra "parcela já lançada em fatura fechada/paga fica congelada":
      em `purchasesRepository.updatePurchase`, bloquear a edição de `Parcela.valor` para parcelas
      cuja `Fatura.status` seja `FECHADA` ou `PAGA` (Edge Case)

**Checkpoint**: US1, US2 e US4 completas — núcleo P1 de cartões/parcelamento pronto.

---

## Phase 6: User Story 8 - Backup local dos dados (Priority: P1)

**Goal**: Exportação/importação completa e local dos dados (FR-023, FR-024).

**Independent Test**: `quickstart.md` → Cenário 4.

### Tests for User Story 8

- [ ] T060 [P] [US8] Testes unitários de `validateBackupFile` em
      `tests/unit/domain/backup.test.ts`: `schemaVersion` desconhecido é rejeitado; shape mínimo
      de cada array em `data` é validado

### Implementation for User Story 8

- [ ] T061 [US8] Implementar `src/domain/backup/serializeBackup.ts` e
      `src/domain/backup/validateBackupFile.ts` (schema `zod`) conforme `contracts/backup.md`
- [ ] T062 [US8] Implementar `src/repositories/backupRepository.ts`: `exportAll()` lendo as 15
      tabelas por completo; `restoreAll(file)` executando **uma única `db.transaction`**
      (delete-all + insert-all respeitando a ordem de foreign keys) conforme `contracts/backup.md`
      — substituição integral, nunca mesclagem (FR-024)
- [ ] T063 [US8] Implementar o fluxo de exportação com `expo-file-system` (escrever o `.json`) +
      `expo-sharing` (compartilhar/salvar)
- [ ] T064 [US8] Implementar o fluxo de importação com `expo-document-picker` (selecionar o
      `.json`) + `validateBackupFile` antes de qualquer escrita no banco
- [ ] T065 [US8] Construir `src/app/(tabs)/mais/backup/index.tsx` (Backup) conforme `Backup.dc.html`:
      botões Exportar/Importar
- [ ] T066 [US8] Construir `src/app/(tabs)/mais/backup/confirmar-restauracao.tsx` (BackupConfirmar) conforme
      `BackupConfirmar.dc.html`: aviso explícito de substituição integral e irreversível antes de
      chamar `restoreAll`

**Checkpoint**: Todas as User Stories P1 (1, 2, 4, 8) completas — MVP pronto para uso.

---

## Phase 7: User Story 9 - Categorizar transações com ícones (Priority: P2)

**Goal**: Categorias pré-definidas + personalizadas como ícone de fallback (FR-027 a FR-030,
FR-037) — pré-requisito visual para US10 e US11.

**Independent Test**: conforme spec.md → User Story 9.

- [ ] T067 [P] [US9] Implementar `src/repositories/categoriesRepository.ts`: CRUD de Categoria
      personalizada; `deleteCategory` atualiza em lote `Compra.categoriaId = NULL` para todas as
      compras que a usavam (FR-037); nunca permite excluir uma Categoria com `predefinida = true`
- [ ] T068 [US9] Estender o formulário de Nova Compra (`src/app/(tabs)/cartoes/nova-compra/index.tsx`)
      para permitir escolher uma Categoria (predefinida ou personalizada) — campo opcional (FR-029)
- [ ] T069 [US9] Construir `src/app/(tabs)/mais/categorias/index.tsx` (Categorias · Main): lista de
      predefinidas + personalizadas
- [ ] T070 [US9] Construir `src/app/(tabs)/mais/categorias/nova.tsx` (CategoriaCriar): nome + escolha de
      ícone lucide entre os disponíveis (FR-028)
- [ ] T071 [P] [US9] Implementar `src/components/TransactionAvatar.tsx` com a ordem de prioridade
      **estabelecimento → categoria → ícone genérico "Outros"** (FR-030), para reuso em toda
      listagem de transações

**Checkpoint**: US9 completa; `TransactionAvatar` disponível para US3, US10 e US11.

---

## Phase 8: User Story 3 - Importar fatura via CSV (Priority: P2)

**Goal**: Importação de CSV genérico e Nubank com tags/comentários (FR-009, FR-010, FR-026).

**Independent Test**: `quickstart.md` → Cenário 6.

### Tests for User Story 3

- [ ] T072 [P] [US3] Testes unitários de `genericParser.parse` em
      `tests/unit/domain/csvImport/genericParser.test.ts`, usando um fixture
      `tests/fixtures/generic-sample.csv` (linhas válidas + ao menos uma linha sem data/valor para
      exercitar FR-026)
- [ ] T073 [P] [US3] Testes unitários de `nubankParser.parse` em
      `tests/unit/domain/csvImport/nubankParser.test.ts`, usando `tests/fixtures/nubank-sample.csv`
      — cobrindo: valor com vírgula e sinal negativo com espaço (`"- 15,92"`), título com aspas
      internas escapadas, padrão `Parcela N/M`, e exclusão da linha `"Pagamento recebido"`

### Implementation for User Story 3

- [ ] T074 [US3] Implementar `src/domain/csvImport/genericParser.ts` conforme
      `contracts/csv-import.md` (separador `;`, data `DD/MM/AAAA`, valor decimal com vírgula)
- [ ] T075 [US3] Implementar `src/domain/csvImport/nubankParser.ts` conforme
      `contracts/csv-import.md` e o formato confirmado em `research.md` (vírgula decimal,
      `"Pagamento recebido"` sempre excluído, créditos/estornos negativos importados como Compra de
      valor negativo)
- [ ] T076 [US3] Implementar `src/repositories/csvImportRepository.ts`: recebe um
      `CsvParseResult`, cria o `LoteImportacao`, persiste cada `CompraDraft` reaproveitando
      `purchasesRepository`/`splitInstallments` — sem caminho especial de persistência para dados
      importados
- [ ] T077 [US3] Construir `src/app/(tabs)/cartoes/importar-csv/index.tsx` (ImportarCSV): escolher cartão de
      destino + formato + upload via `expo-document-picker`
- [ ] T078 [US3] Construir `src/app/(tabs)/cartoes/importar-csv/resultado.tsx` (ImportarCSVResultado):
      contagem de linhas importadas/ignoradas com motivo (FR-026)
- [ ] T079 [US3] Estender a tela de edição de transação para permitir adicionar tags e comentário a
      uma transação importada (FR-007)

**Checkpoint**: US3 completa e testável de forma independente.

---

## Phase 9: User Story 5 - Sugestão de melhor cartão para comprar hoje (Priority: P2)

**Goal**: Ranquear cartões pelo prazo total até o vencimento da fatura correspondente (FR-012).

**Independent Test**: conforme spec.md → User Story 5.

- [ ] T080 [P] [US5] Testes unitários de `suggestBestCard` em `tests/unit/domain/bestCard.test.ts`:
      dois cartões com ciclos diferentes, cartão arquivado excluído do ranking (FR-025), empate
      exato resolvido por `criadoEm` mais antigo
- [ ] T081 [US5] Implementar `src/domain/bestCard/suggestBestCard.ts` conforme
      `contracts/best-card.md`
- [ ] T082 [P] [US5] Implementar o hook `src/hooks/useBestCard.ts`
- [ ] T083 [US5] Exibir a sugestão de melhor cartão na tela `src/app/(tabs)/inicio/index.tsx` (Início) e/ou no
      fluxo de Nova Compra, conforme `design-brief.md`

**Checkpoint**: US5 completa e testável de forma independente.

---

## Phase 10: User Story 6 - Assinaturas recorrentes e total mensal (Priority: P2)

**Goal**: Geração mensal automática e idempotente de cobranças de assinatura (FR-016 a FR-018).

**Independent Test**: conforme spec.md → User Story 6.

- [ ] T084 [P] [US6] Testes unitários de `pendingChargesFor` e `monthlySubscriptionsTotal` em
      `tests/unit/domain/subscriptions.test.ts`, incluindo o caso de idempotência (não gerar 2x no
      mesmo mês para a mesma assinatura)
- [ ] T085 [US6] Implementar `src/domain/subscriptions/pendingChargesFor.ts` e
      `src/domain/subscriptions/monthlySubscriptionsTotal.ts` conforme `contracts/subscriptions.md`
- [ ] T086 [US6] Implementar `src/repositories/subscriptionsRepository.ts`: CRUD de Assinatura;
      `generatePendingCharges()` cria a Compra (`origem = ASSINATURA`) + Parcela para cada
      `PendingCharge`, copiando forma de pagamento/cartão/categoria/tags **vigentes no momento da
      geração** (FR-017)
- [ ] T087 [US6] Disparar `generatePendingCharges()` em `src/app/_layout.tsx` (após as migrations) ou
      ao entrar nas telas de Início/Assinaturas
- [ ] T088 [US6] Construir `src/app/(tabs)/assinaturas/index.tsx` (Assinaturas · Main): lista de
      assinaturas ativas + total mensal somado (FR-018), com FAB "+" para nova assinatura
- [ ] T089 [US6] Construir `src/app/(tabs)/assinaturas/[subscriptionId].tsx` (AssinaturaEditar) —
      reutilizada tanto para **criar uma nova Assinatura** (FR-016, acessada pelo FAB "+" de T088)
      quanto para editar uma existente: nome/valor/forma de pagamento/dia; mudança de forma de
      pagamento em uma assinatura já existente só afeta gerações futuras, nunca reescreve cobranças
      já geradas (Edge Case)
- [ ] T090 [US6] Confirmar que uma assinatura paga via Pix desconta do saldo do mês (via
      `computeMonthBalance` da US2), não de uma fatura de cartão (FR-017, cenário 2)

**Checkpoint**: US6 completa e testável de forma independente.

---

## Phase 11: User Story 11 - Painel de estatísticas e comparação de consumo (Priority: P2)

**Goal**: Estatísticas por período com comparação, categoria, maiores gastos e meta ideal (FR-038
a FR-045). Depende de US1, US2 e US9 já existirem.

**Independent Test**: conforme spec.md → User Story 11.

### Tests for User Story 11

- [ ] T091 [P] [US11] Testes unitários de `resolvePeriod`, `totalSpent`, `compareToPrevious` em
      `tests/unit/domain/statistics.test.ts`, incluindo o caso "sem dado do período anterior" —
      indicar ausência de comparação em vez de uma variação incorreta (FR-041 Edge Case)
- [ ] T092 [P] [US11] Testes unitários de `spendingByCategory`, `topExpenses`,
      `subscriptionsShare`, `idealSpendComparison` em `tests/unit/domain/statistics.test.ts`,
      incluindo o caso "sem renda/meta configurada" (FR-042 Edge Case)

### Implementation for User Story 11

- [ ] T093 [US11] Implementar `src/domain/statistics/resolvePeriod.ts`,
      `src/domain/statistics/totalSpent.ts`, `src/domain/statistics/compareToPrevious.ts`
      conforme `contracts/statistics.md`
- [ ] T094 [US11] Implementar `src/domain/statistics/spendingByCategory.ts`,
      `src/domain/statistics/topExpenses.ts`, `src/domain/statistics/subscriptionsShare.ts`,
      `src/domain/statistics/idealSpendComparison.ts` conforme `contracts/statistics.md`
- [ ] T095 [US11] Implementar `src/repositories/statisticsRepository.ts` e
      `src/repositories/idealGoalRepository.ts` (CRUD da `MetaConsumoIdeal` singleton)
- [ ] T096 [P] [US11] Implementar o hook `src/hooks/useStatistics.ts`
- [ ] T097 [US11] Construir o gráfico de consumo mensal em `src/app/(tabs)/inicio/index.tsx` (Início)
      conforme `Main.dc.html`, tocável para abrir a tela de Estatísticas
- [ ] T098 [US11] Construir `src/app/(tabs)/inicio/estatisticas.tsx` (Estatísticas) conforme
      `Estatisticas.dc.html`: seletor de período (Diário/Semanal/Mensal/Anual), total + comparação,
      gasto por categoria, maiores gastos, % de assinaturas, seção de meta ideal (condicional a
      haver renda **e** meta configuradas)
- [ ] T099 [US11] Construir a configuração de Meta de Consumo Ideal (percentual da renda mensal
      vigente) integrada à tela de Estatísticas ou Renda, conforme `design-brief.md`

**Checkpoint**: US11 completa e testável de forma independente.

---

## Phase 12: User Story 12 - Dividir compras com outras pessoas (Priority: P2)

**Goal**: Responsabilidade de compra diferente do total, sem alterar fatura/saldo (FR-046 a
FR-055). Depende de US1, US4 e US11 já existirem.

**Independent Test**: `quickstart.md` → Cenário 5.

### Tests for User Story 12

- [ ] T100 [P] [US12] Testes unitários de `validateManualResponsibility`,
      `requiresMotivoResponsavelFields`, `shouldShowResponsibilitySummary` em
      `tests/unit/domain/expenseSplitting.test.ts` — **`0 ≤ valorResponsabilidade ≤
      valorTotalOriginal`** (FR-048)
- [ ] T101 [P] [US12] Testes unitários de `recomputeSplitOnRefund` em
      `tests/unit/domain/installments.test.ts`: sem entrada vinculada, uma entrada, múltiplas
      entradas (soma subtraída do total), entrada desvinculada volta ao valor manual (se houver)
      ou ao total (Edge Cases)
- [ ] T102 [P] [US12] Testes unitários da precedência completa de responsabilidade
      (`resolveResponsibility`) em `tests/unit/domain/expenseSplitting.test.ts`: nada definido →
      usa o total (FR-049); só valor manual definido → usa o manual; entradas vinculadas presentes
      → **sempre vencem, mesmo havendo um valor manual também definido** (Edge Case de precedência,
      FR-051)

### Implementation for User Story 12

- [ ] T103 [US12] Implementar `src/domain/expenseSplitting/resolveResponsibility.ts`: a função
      `responsabilidadeEfetiva(compra, entradasVinculadas)` de `data-model.md`, com a precedência
      completa de 3 vias — **(1) soma de entradas vinculadas, se houver; (2)
      `valorResponsabilidade` manual; (3) `valorTotalOriginal`** — reunindo em um único ponto a
      lógica hoje distribuída entre `splitInstallments` e `recomputeSplitOnRefund`, para que
      nenhum repositório precise decidir essa precedência por conta própria
- [ ] T104 [US12] Implementar `src/domain/expenseSplitting/validateManualResponsibility.ts`,
      `requiresMotivoResponsavelFields.ts`, `shouldShowResponsibilitySummary.ts` conforme
      `contracts/expense-splitting.md`
- [ ] T105 [US12] Implementar `src/domain/installments/recomputeSplitOnRefund.ts` conforme
      `contracts/installments.md`, e integrá-la à proporção usada em `splitInstallments` — mesma
      fração de responsabilidade aplicada em cada parcela (FR-055)
- [ ] T106 [US12] Estender `src/repositories/cashEntriesRepository.ts`: suportar
      `compraVinculadaId` ao criar/editar/excluir uma EntradaAvulsa, chamando
      `resolveResponsibility` (T103) — que internamente usa `recomputeSplitOnRefund` quando há
      entradas vinculadas — e atualizando `Parcela.valorResponsabilidade` de todas as parcelas da
      Compra afetada (FR-051)
- [ ] T107 [US12] Estender `src/repositories/purchasesRepository.ts`: suportar
      `valorResponsabilidade`/`motivo`/`responsavel` na criação/edição de Compra, validando com
      `validateManualResponsibility` e sempre recalculando o valor efetivo via
      `resolveResponsibility` (T103) — nunca lendo `Compra.valorResponsabilidade` diretamente para
      exibição ou estatística
- [ ] T108 [US12] Construir `src/app/(tabs)/cartoes/nova-compra/divisao-manual.tsx`
      (NovaCompraDivisaoManual) conforme `NovaCompraDivisaoManual.dc.html`
- [ ] T109 [US12] Construir `src/app/(tabs)/cartoes/nova-compra/divisao-vinculada.tsx`
      (NovaCompraDivisaoVinculada) conforme `NovaCompraDivisaoVinculada.dc.html`
- [ ] T110 [US12] Exibir o resumo "Você paga: R$ X" em `FaturaDetalhe.tsx` e `CartaoDetalhe.tsx`
      usando `shouldShowResponsibilitySummary` — **nunca altera o valor total exibido da fatura**
      (FR-052, FR-053)
- [ ] T111 [US12] Confirmar que `domain/statistics` (US11) usa `resolveResponsibility` (T103) em
      vez de `Compra.valor`/`Compra.valorResponsabilidade` diretamente em
      `totalSpent`/`spendingByCategory`/`topExpenses` (FR-054); adicionar um caso de teste com uma
      compra dividida em `tests/unit/domain/statistics.test.ts`

**Checkpoint**: US12 completa e testável de forma independente.

---

## Phase 13: User Story 10 - Mapear estabelecimentos conhecidos com avatar (Priority: P3)

**Goal**: Reconhecimento automático de estabelecimento por padrão de texto + avatar, com busca
opcional de logotipo (FR-031 a FR-036). Depende de US9 e US3 já existirem.

**Independent Test**: conforme spec.md → User Story 10.

### Tests for User Story 10

- [ ] T112 [P] [US10] Testes unitários de `matchEstablishment`, `reevaluateUnassignedTransactions`,
      `suggestInitialPattern` em `tests/unit/domain/establishmentMatching.test.ts` — desempate por
      padrão mais longo e depois por `estabelecimentoCriadoEm` mais antigo (Assumption)

### Implementation for User Story 10

- [ ] T113 [US10] Implementar `src/domain/establishmentMatching/matchEstablishment.ts`,
      `reevaluateUnassignedTransactions.ts`, `suggestInitialPattern.ts` conforme
      `contracts/establishment-matching.md`
- [ ] T114 [US10] Implementar `src/repositories/establishmentsRepository.ts`: CRUD de
      Estabelecimento + PadraoReconhecimento; ao adicionar um padrão, chamar
      `reevaluateUnassignedTransactions` e atualizar as Compras retornadas — **nunca sobrescrevendo
      uma associação com `estabelecimentoManual = true`** (FR-034, FR-035)
- [ ] T115 [US10] Estender `src/repositories/purchasesRepository.ts` e a tela de edição de Compra:
      permitir associar ou remover manualmente o Estabelecimento de uma transação **já existente**
      (mesmo sem nenhum padrão reconhecido, ou para corrigir uma associação automática incorreta),
      sempre marcando `estabelecimentoManual = true` ao fazer isso — distinto de T118, que é a
      criação de um novo Estabelecimento (FR-034)
- [ ] T116 [US10] Integrar `matchEstablishment` em `purchasesRepository.createPurchase` e
      `csvImportRepository` — toda Compra nova ou importada passa pelo matching automático (FR-033)
- [ ] T117 [US10] Implementar a busca best-effort de logotipo via Brandfetch CDN
      (`https://cdn.brandfetch.io/{domain}`) + cache local via `expo-file-system`, salvando em
      `Estabelecimento.logoCachePath`; falha/timeout/offline **nunca bloqueia** e sempre recai no
      `iconeRespaldo` (FR-036, Princípio I)
- [ ] T118 [US10] Construir `src/app/(tabs)/mais/estabelecimentos/index.tsx` (EstabelecimentosLista), com
      FAB "+" para novo estabelecimento
- [ ] T119 [US10] Construir `src/app/(tabs)/mais/estabelecimentos/[establishmentId].tsx`
      (EstabelecimentoDetalhe) — reutilizada tanto para **criar um novo Estabelecimento** a partir
      do FAB "+" de T118 (FR-031) quanto para editar um existente: nome, ícone de respaldo
      (obrigatório), domínio opcional, lista de padrões
- [ ] T120 [US10] Construir a criação de estabelecimento inline a partir da edição de uma
      transação (`src/app/(tabs)/cartoes/nova-compra/estabelecimento.tsx`,
      `NovaCompraEstabelecimento.dc.html`), sugerindo o padrão inicial via `suggestInitialPattern`
      (FR-032)
- [ ] T121 [US10] Atualizar `TransactionAvatar` (US9) para preferir `logoCachePath` >
      `iconeRespaldo` > categoria > "Outros" (FR-030)

**Checkpoint**: US10 completa e testável de forma independente.

---

## Phase 14: User Story 7 - Reservas de dinheiro guardado com rendimento (Priority: P3)

**Goal**: Reservas com depósitos, retiradas e rendimento manual; taxa configurável apenas
cadastrada, sem aplicação automática (FR-019 a FR-021).

**Independent Test**: conforme spec.md → User Story 7.

- [ ] T122 [P] [US7] Implementar `src/repositories/reservesRepository.ts`: CRUD de Reserva
      (nome + taxa de rendimento mensal opcional); saldo **sempre derivado** como soma de
      `LancamentoReserva.valor` (nunca uma coluna própria)
- [ ] T123 [US7] Implementar `src/repositories/reserveEntriesRepository.ts`: criar
      `LancamentoReserva` do tipo `DEPOSITO`, `RETIRADA` ou `RENDIMENTO_MANUAL`; **nenhum código
      gera `RENDIMENTO_AUTOMATICO` nesta versão** (Princípio V / Assumption)
- [ ] T124 [US7] Construir `src/app/(tabs)/reservas/index.tsx` (Reservas · Main): lista de reservas +
      saldo de cada uma, com FAB "+" para nova reserva
- [ ] T125 [US7] Construir `src/app/(tabs)/reservas/[reserveId].tsx` (ReservaDetalhe) — reutilizada
      tanto para **criar uma nova Reserva** (nome + taxa de rendimento mensal opcional, a partir do
      FAB "+" de T124 — FR-019, FR-021) quanto para exibir uma existente: saldo, taxa configurada
      (exibida, **não aplicada automaticamente** — FR-021), histórico de lançamentos, formulário de
      novo lançamento manual

**Checkpoint**: Todas as 12 User Stories completas e independentemente funcionais.

---

## Phase 15: Polish & Cross-Cutting Concerns

**Purpose**: Validação final e qualidade transversal a todas as stories.

- [ ] T126 [P] Rodar `quickstart.md` de ponta a ponta em um dispositivo Android real via Expo Go,
      conferindo os 7 cenários
- [ ] T127 [P] Revisão de contraste/acessibilidade da implementação real contra os tokens
      validados em `design-brief.md` (WCAG já computado na fase de design — confirmar que os
      componentes Tamagui construídos batem com esses valores)
- [ ] T128 [P] Testes de integração em `tests/integration/` (on-device) para: migrations rodando
      do zero em um banco limpo, e round-trip completo de backup export→import (FR-024)
- [ ] T129 Medir tempo de boot+migrations e tempo de abertura das listagens principais contra as
      metas do Technical Context (`plan.md`: <500ms boot, <100ms listagens)
- [ ] T130 [P] Revisar cada tela construída contra os canvases aprovados em `design-brief.md`
      para fidelidade visual
- [ ] T131 Revisão final da Constitution Check (`plan.md`) contra o código entregue: confirmar que
      nenhuma chamada de rede além da busca de logotipo Brandfetch foi introduzida, e que ela
      permanece best-effort/não-bloqueante
- [ ] T132 Registrar em `specs/001-personal-finance-tracker/checklists/requirements.md` a entrada
      final de "implementação concluída"

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: depende do Setup — **bloqueia todas as User Stories**
- **User Stories (Phase 3–14)**: todas dependem da Fase 2 completa; dentro delas, a ordem de
  prioridade e dependência declarada na spec é: US1 → US2 → US4 → US8 (todas P1, sem dependência
  entre si além da fundação) → US9 → US3 → US5 → US6 → US11 → US12 (P2, na ordem que respeita as
  dependências "Why this priority" da spec: US11 precisa de US1/US2/US9; US12 precisa de
  US1/US4/US11) → US10 → US7 (P3; US10 precisa de US9/US3)
- **Polish (Phase 15)**: depende de todas as User Stories desejadas estarem completas

### User Story Dependencies (conforme `spec.md`)

- **US1 (P1)**: sem dependência de outra story
- **US2 (P1)**: sem dependência de outra story (pode rodar em paralelo com US1 após a Fase 2)
- **US4 (P1)**: depende de US1 (fatura precisa existir para alocar parcelas)
- **US8 (P1)**: depende de US1/US2/US4 existirem para ter o que exportar, mas o mecanismo de
  backup em si é independente
- **US9 (P2)**: sem dependência de outra story além da fundação
- **US3 (P2)**: depende de US1 (fatura) e reaproveita US4 (parcelamento)
- **US5 (P2)**: depende de US1
- **US6 (P2)**: depende de US1 e US2
- **US11 (P2)**: depende de US1, US2 e US9
- **US12 (P2)**: depende de US1, US4 e US11
- **US10 (P3)**: depende de US9 e US3
- **US7 (P3)**: sem dependência de outra story além da fundação

### Parallel Opportunities

- Todas as tarefas `[P]` da Fase 1 e da Fase 2 podem rodar em paralelo entre si
- Dentro da Fase 2, T010–T022 (definição de tabelas) são todas `[P]` — arquivos/seções distintas
  do mesmo `schema.ts`, mas sem dependência lógica entre si até T023 (geração da migration)
- Após a Fase 2: US1 e US2 podem ser feitas em paralelo (nenhuma depende da outra); US9 e US5
  também podem rodar em paralelo entre si e com US6, uma vez que US1 esteja pronta
- Testes unitários marcados `[P]` de uma mesma story podem rodar em paralelo entre si

---

## Parallel Example: User Story 1

```bash
# Testes de US1 em paralelo:
Task: "Testes unitários de resolveInvoicePeriod em tests/unit/domain/invoices.test.ts"
Task: "Testes unitários de computeInvoiceStatus e computeInvoiceTotals em tests/unit/domain/invoices.test.ts"

# Repositório + hooks de US1 em paralelo (depois do domínio pronto):
Task: "Implementar src/repositories/cardsRepository.ts"
Task: "Implementar os hooks src/hooks/useCards.ts e src/hooks/useInvoice.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 4, 8 — todas P1)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (CRÍTICO — bloqueia todas as stories)
3. Completar Fase 3 (US1) → Fase 4 (US2) → Fase 5 (US4) → Fase 6 (US8)
4. **PARAR e VALIDAR**: rodar `quickstart.md` Cenários 1–4 em um Android real
5. Esse é o MVP funcional: cartões, fatura, parcelamento, saldo do mês e backup

### Incremental Delivery

1. Setup + Foundational → fundação pronta
2. US1 → US2 → US4 → US8 → **MVP** (testar cada uma independentemente antes de seguir)
3. US9 → US3 → US5 → US6 → US11 → US12 (P2, nesta ordem de dependência)
4. US10 → US7 (P3)
5. Polish (Fase 15)

Cada story soma valor sem quebrar as anteriores — o app é usável e útil já a partir do MVP (P1).

---

## Notes

- `[P]` = arquivos diferentes, sem dependência entre si
- `[Story]` mapeia cada tarefa à sua User Story para rastreabilidade
- Toda constraint de campo citada em `data-model.md` (ranges, enums, unicidade) foi reproduzida
  literalmente nas tarefas correspondentes, para não deixar a validação a critério da
  implementação
- Testes de domínio devem falhar antes da implementação correspondente (ordem: teste → domínio →
  repositório → UI, dentro de cada story)
- Rodar `npm test` após cada tarefa de domínio; commitar por tarefa ou por grupo lógico
- Parar em qualquer checkpoint de story para validar antes de seguir para a próxima
