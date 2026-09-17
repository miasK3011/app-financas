---

description: "Task list for Controle Financeiro Pessoal — Núcleo"
---

# Tasks: Controle Financeiro Pessoal — Núcleo (Cartões, Fluxo de Caixa, Assinaturas e Reservas)

**Input**: Design documents from `/specs/001-personal-finance-tracker/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (all present)

**Tests**: Incluídas para toda a lógica de `app/domain/**`, conforme a estratégia de testes definida
em `research.md` (Decisão: Estratégia de testes sem backend/API) — não são testes de UI/e2e, que
ficam cobertos pela validação manual de `quickstart.md`.

**Organization**: Tarefas agrupadas por User Story (spec.md), em ordem de prioridade (P1 → P2 → P3),
respeitando as dependências entre stories declaradas na própria spec ("Why this priority").

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: A qual User Story a tarefa pertence (US1..US12)
- Caminhos de arquivo exatos em cada descrição, conforme `plan.md` → Project Structure

## Path Conventions

Projeto Expo único (mobile, sem backend separado — ver `plan.md`): `app/` (rotas `expo-router` +
`domain/` + `db/` + `repositories/` + `hooks/` + `components/` + `theme/`), `tests/` na raiz.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialização do projeto Expo e ferramentas compartilhadas.

- [ ] T001 Inicializar projeto Expo (TypeScript) na raiz do repositório, criando as pastas `app/`
      e `tests/` conforme `plan.md` → Project Structure, sem sobrescrever `specs/`, `design/` ou
      `.specify/` já existentes
- [ ] T002 [P] Instalar e configurar Tamagui (`tamagui`, `@tamagui/core`, `@tamagui/config`);
      criar `app/theme/tamagui.config.ts` com os tokens de `design-brief.md` §3.1 (cores
      `--color-primary #2E6F55`, `--color-error #C74A3C`, `--color-info #2F6FB0`, raios `20px`/`14px`,
      fontes Manrope + Lora via Google Fonts)
- [ ] T003 [P] Instalar Drizzle ORM (`drizzle-orm`, `drizzle-kit`, `expo-sqlite`); criar
      `drizzle.config.ts` na raiz (dialect `sqlite`, schema `app/db/schema.ts`,
      out `app/db/migrations`)
- [ ] T004 [P] Instalar as demais dependências de `research.md` → Resumo de dependências:
      `lucide-react-native`, `react-native-svg`, `date-fns`, `react-hook-form`, `zod`, `papaparse`,
      `expo-file-system`, `expo-sharing`, `expo-document-picker`, `expo-crypto`
- [ ] T005 [P] Configurar ESLint + Prettier + `tsconfig.json` em modo `strict: true`
- [ ] T006 [P] Configurar Jest (`jest-expo` preset) + `@testing-library/react-native`; criar
      `tests/unit/`, `tests/integration/`; adicionar script `npm test`
- [ ] T007 Criar o esqueleto de rotas `expo-router`: `app/_layout.tsx` (stack raiz) e
      `app/(tabs)/_layout.tsx` (tab layout), com uma tela placeholder vazia para cada uma das 19
      rotas listadas em `plan.md` → Project Structure

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema do banco, migrations, boot do app e utilitários compartilhados por todas as
User Stories.

**⚠️ CRITICAL**: Nenhuma User Story pode começar antes desta fase estar completa.

- [ ] T008 [P] Implementar `app/domain/shared/money.ts`: conversão reais↔centavos e
      `formatBRL(cents: number): string`
- [ ] T009 [P] Implementar `app/domain/shared/dateClamp.ts`: `clampDayToMonth(day, year, month):
      Date`, cobrindo o Edge Case "dia de fechamento/vencimento/cobrança configurado além do
      último dia de um mês mais curto ajusta automaticamente para o último dia válido daquele mês"
- [ ] T010 Definir a tabela `Cartão` em `app/db/schema.ts`: `id` (text PK, uuid), `nome` (text not
      null), `diaFechamento`/`diaVencimento` (integer not null, **1–31**), `arquivadoEm` (integer
      nullable — `NULL` = ativo), `criadoEm` (integer not null), conforme `data-model.md`
- [ ] T011 [P] Definir a tabela `Fatura` em `app/db/schema.ts`: campos conforme `data-model.md`,
      **único por `(cartaoId, referenciaAno, referenciaMes)`**, `status` enum
      `ABERTA | FECHADA | PAGA`
- [ ] T012 [P] Definir a tabela `Compra` em `app/db/schema.ts` com todos os campos de
      `data-model.md`, incluindo `valorResponsabilidade` (integer nullable), `motivo`/`responsavel`
      (text nullable), `estabelecimentoManual` (boolean not null default false), `origem` enum
      `MANUAL | CSV_IMPORT | ASSINATURA`, e a validação **`1 ≤ parcelaAtual ≤ parcelasTotal`**
      expressa como schema `zod` companion em `app/domain/shared/purchaseSchema.ts`
- [ ] T013 [P] Definir a tabela `Parcela` em `app/db/schema.ts`: `faturaId` (text FK **nullable** —
      `NULL` quando a Compra é PIX), `numero`, `valor`, `valorResponsabilidade`, conforme
      `data-model.md`
- [ ] T014 [P] Definir as tabelas `Tag` (nome **UNIQUE**) e `CompraTag` (PK composta
      `compraId`+`tagId`) em `app/db/schema.ts`
- [ ] T015 [P] Definir as tabelas `Assinatura` e `AssinaturaTag` em `app/db/schema.ts` conforme
      `data-model.md`
- [ ] T016 [P] Definir a tabela `ConfiguracaoRenda` em `app/db/schema.ts` (histórico por
      `vigenteDesde`, nunca reescrito)
- [ ] T017 [P] Definir a tabela `EntradaAvulsa` em `app/db/schema.ts`, com `compraVinculadaId`
      (text FK nullable → Compra)
- [ ] T018 [P] Definir as tabelas `Reserva` e `LancamentoReserva` em `app/db/schema.ts` —
      `LancamentoReserva.tipo` enum `DEPOSITO | RETIRADA | RENDIMENTO_MANUAL |
      RENDIMENTO_AUTOMATICO` (o último reservado para a feature futura; nenhum código o gera ainda)
- [ ] T019 [P] Definir a tabela `LoteImportacao` em `app/db/schema.ts`
- [ ] T020 [P] Definir a tabela `Categoria` em `app/db/schema.ts` (`predefinida` boolean not null)
- [ ] T021 [P] Definir as tabelas `Estabelecimento` e `PadraoReconhecimento` em `app/db/schema.ts`
- [ ] T022 [P] Definir a tabela singleton `MetaConsumoIdeal` em `app/db/schema.ts`
      (`percentualDaRenda` real not null)
- [ ] T023 Rodar `npx drizzle-kit generate` para produzir a migration inicial em
      `app/db/migrations/`; conferir as 15 tabelas geradas contra `data-model.md`
- [ ] T024 Implementar `app/db/client.ts`: abrir o banco `expo-sqlite`, envolver com `drizzle()`,
      exportar a instância `db` tipada
- [ ] T025 Implementar o gate de migration no boot em `app/_layout.tsx` usando `useMigrations` de
      `drizzle-orm/expo-sqlite/migrator`, exibindo uma tela de loading até concluir — nenhuma
      navegação é montada antes disso (`research.md` → Decisão: Migrations no boot)
- [ ] T026 Implementar o seed das Categorias pré-definidas (Compras, Transporte, Alimentação,
      Assinaturas, Saúde, Lazer, **Outros**) rodando uma vez após as migrations, se a tabela
      `Categoria` estiver vazia; `Outros` sempre com `predefinida = true` e nunca excluível
- [ ] T027 Aplicar os tokens do tema Tamagui no shell do app (`TamaguiProvider` em
      `app/_layout.tsx`), carregando Manrope + Lora via `expo-font`

**Checkpoint**: Fundação pronta — as User Stories podem começar.

---

## Phase 3: User Story 1 - Cadastrar cartões e ver o valor certo da fatura (Priority: P1) 🎯 MVP

**Goal**: Cadastro de cartões com fechamento/vencimento e cálculo automático de em qual fatura cada
compra cai (FR-001, FR-002, FR-011).

**Independent Test**: `quickstart.md` → Cenário 1.

### Tests for User Story 1

- [ ] T028 [P] [US1] Testes unitários de `resolveInvoicePeriod` em
      `tests/unit/domain/invoices.test.ts`: compra antes do fechamento cai no ciclo atual; compra
      **no dia exato do fechamento** cai no ciclo que fecha **naquele mesmo dia** (não no seguinte);
      compra um dia após o fechamento cai no ciclo seguinte (FR-002, cenários 1–3 da User Story 1)
- [ ] T029 [P] [US1] Testes unitários de `computeInvoiceStatus` e `computeInvoiceTotals` em
      `tests/unit/domain/invoices.test.ts`

### Implementation for User Story 1

- [ ] T030 [US1] Implementar `app/domain/invoices/resolveInvoicePeriod.ts` conforme
      `contracts/invoices.md`
- [ ] T031 [US1] Implementar `app/domain/invoices/ensureInvoice.ts` (upsert idempotente por
      `(cardId, year, month)`) conforme `contracts/invoices.md`
- [ ] T032 [US1] Implementar `app/domain/invoices/computeInvoiceStatus.ts` e
      `app/domain/invoices/computeInvoiceTotals.ts` conforme `contracts/invoices.md` (FR-011)
- [ ] T033 [P] [US1] Implementar `app/repositories/cardsRepository.ts`: criar/listar/arquivar
      Cartão, validando `diaFechamento`/`diaVencimento` entre 1 e 31
- [ ] T034 [US1] Implementar `app/repositories/invoicesRepository.ts`: `getOrCreateInvoice`,
      `listInvoicesForCard`, `markInvoiceAsPaid`, agregando totais via `computeInvoiceTotals`
- [ ] T035 [US1] Implementar `app/repositories/purchasesRepository.ts` (versão mínima): criar uma
      Compra à vista no cartão (1 parcela, sem parcelamento — estendido na US4), associando-a à
      fatura correta via `resolveInvoicePeriod` + `ensureInvoice`
- [ ] T036 [P] [US1] Implementar os hooks `app/hooks/useCards.ts` e `app/hooks/useInvoice.ts`
- [ ] T037 [US1] Construir `app/(tabs)/cartoes/index.tsx` (Cartões · Main) conforme
      `design-brief.md` §5 e `design/cartoes-e-compra/Main.dc.html`: lista de cartões, card
      "Total das faturas abertas", FAB "+" para novo cartão
- [ ] T038 [US1] Construir o formulário de novo cartão (`react-hook-form` + `zod`): nome,
      diaFechamento (1–31), diaVencimento (1–31)
- [ ] T039 [US1] Construir `app/(tabs)/cartoes/[cardId]/index.tsx` (Cartão · Faturas) conforme
      `CartaoDetalhe.dc.html`: lista de faturas com badge de status distinto para "Aberta"
      (`--color-info`/`--color-info-dark`)
- [ ] T040 [US1] Construir `app/(tabs)/cartoes/[cardId]/fatura/[invoiceId].tsx` (Fatura · Detalhe)
      conforme `FaturaDetalhe.dc.html`: valor total, lista de compras da fatura, botão "Marcar
      fatura como paga" chamando `markInvoiceAsPaid`

**Checkpoint**: User Story 1 completa e testável de forma independente (`quickstart.md` Cenário 1).

---

## Phase 4: User Story 2 - Acompanhar o saldo do mês (Priority: P1)

**Goal**: Renda mensal + entradas avulsas + compras Pix compondo o saldo do mês (FR-013 a FR-015).

**Independent Test**: `quickstart.md` → Cenário 2.

### Tests for User Story 2

- [ ] T041 [P] [US2] Testes unitários de `computeMonthBalance` em
      `tests/unit/domain/cashflow.test.ts`, cobrindo os 3 cenários de aceite da User Story 2

### Implementation for User Story 2

- [ ] T042 [P] [US2] Implementar `app/repositories/incomeConfigRepository.ts`:
      `setIncome(valor, vigenteDesde)`, `getIncomeForMonth(year, month)` (retorna o valor de maior
      `vigenteDesde` ≤ início do mês, sem reescrever histórico — FR-013)
- [ ] T043 [P] [US2] Implementar `app/repositories/cashEntriesRepository.ts`: CRUD de EntradaAvulsa
- [ ] T044 [US2] Estender `app/repositories/purchasesRepository.ts` para suportar forma de
      pagamento PIX (Parcela sem `faturaId`, contando pela `dataCompra` — nota de `data-model.md`)
- [ ] T045 [US2] Implementar `app/domain/cashflow/computeMonthBalance.ts`: saldo = renda vigente +
      soma(EntradaAvulsa do mês) − soma(Parcela PIX do mês) − soma(Fatura que vence no mês) (FR-015)
- [ ] T046 [P] [US2] Implementar os hooks `app/hooks/useIncome.ts` e `app/hooks/useMonthBalance.ts`
- [ ] T047 [US2] Construir `app/(tabs)/renda/index.tsx` (Renda & Entradas · Main, incluindo o
      estado vazio de `MainMesVazio.dc.html`): renda configurável, lista de entradas avulsas do
      mês, saldo do mês em destaque
- [ ] T048 [US2] Construir `app/(tabs)/renda/nova-entrada.tsx` (EntradaAvulsaNova): formulário de
      nova entrada avulsa (descrição, valor, data)
- [ ] T049 [US2] Construir `app/(tabs)/renda/historico.tsx` (aba Histórico, `MainHistorico.dc.html`)
      com o histórico de valores de renda ao longo do tempo

**Checkpoint**: User Stories 1 e 2 ambas funcionais e testáveis de forma independente.

---

## Phase 5: User Story 4 - Comprar parcelado, inclusive em andamento (Priority: P1)

**Goal**: Divisão automática do valor entre faturas futuras, incluindo compras cujo parcelamento já
estava em andamento antes da adoção do app (FR-004 a FR-006, FR-008).

**Independent Test**: `quickstart.md` → Cenário 3.

### Tests for User Story 4

- [ ] T050 [P] [US4] Testes unitários de `splitInstallments` em
      `tests/unit/domain/installments.test.ts`: split simples (R$300/3x), parcela atual > 1
      (gera só as parcelas restantes), erro quando **`parcelaAtual > parcelasTotal`** ou
      **`parcelaAtual < 1`** (FR-005), diferença de arredondamento absorvida pela primeira parcela
      gerada
- [ ] T051 [P] [US4] Testes unitários de `allocateInstallmentsToInvoices` em
      `tests/unit/domain/installments.test.ts`

### Implementation for User Story 4

- [ ] T052 [US4] Implementar `app/domain/installments/splitInstallments.ts` conforme
      `contracts/installments.md`, incluindo `InvalidInstallmentError` para a validação FR-005
- [ ] T053 [US4] Implementar `app/domain/installments/allocateInstallmentsToInvoices.ts` conforme
      `contracts/installments.md`
- [ ] T054 [US4] Estender `app/repositories/purchasesRepository.ts`: ao criar uma Compra `CARTAO`
      com `parcelasTotal > 1`, chamar `splitInstallments` + `allocateInstallmentsToInvoices`,
      garantindo (via `ensureInvoice`) que cada Fatura futura necessária exista antes de inserir a
      Parcela correspondente
- [ ] T055 [US4] Implementar a persistência de tags/comentário compartilhados: `CompraTag` é
      gravado uma única vez por Compra — todas as Parcelas herdam via `compraId`, nunca por parcela
      (FR-008)
- [ ] T056 [US4] Construir `app/(tabs)/cartoes/nova-compra/index.tsx` (Nova Compra) conforme
      `NovaCompra.dc.html`: descrição, valor total, data, forma de pagamento, cartão,
      `parcelasTotal`, `parcelaAtual` (opcional, default 1), tags, comentário — validação `zod`
      reaproveitando as regras de `splitInstallments`
- [ ] T057 [US4] Construir `app/(tabs)/cartoes/nova-compra/categoria.tsx` (drawer de categoria)
      conforme `NovaCompraCategoria.dc.html`
- [ ] T058 [US4] Implementar a regra "parcela já lançada em fatura fechada/paga fica congelada":
      em `purchasesRepository.updatePurchase`, bloquear a edição de `Parcela.valor` para parcelas
      cuja `Fatura.status` seja `FECHADA` ou `PAGA` (Edge Case)

**Checkpoint**: US1, US2 e US4 completas — núcleo P1 de cartões/parcelamento pronto.

---

## Phase 6: User Story 8 - Backup local dos dados (Priority: P1)

**Goal**: Exportação/importação completa e local dos dados (FR-023, FR-024).

**Independent Test**: `quickstart.md` → Cenário 4.

### Tests for User Story 8

- [ ] T059 [P] [US8] Testes unitários de `validateBackupFile` em
      `tests/unit/domain/backup.test.ts`: `schemaVersion` desconhecido é rejeitado; shape mínimo
      de cada array em `data` é validado

### Implementation for User Story 8

- [ ] T060 [US8] Implementar `app/domain/backup/serializeBackup.ts` e
      `app/domain/backup/validateBackupFile.ts` (schema `zod`) conforme `contracts/backup.md`
- [ ] T061 [US8] Implementar `app/repositories/backupRepository.ts`: `exportAll()` lendo as 15
      tabelas por completo; `restoreAll(file)` executando **uma única `db.transaction`**
      (delete-all + insert-all respeitando a ordem de foreign keys) conforme `contracts/backup.md`
      — substituição integral, nunca mesclagem (FR-024)
- [ ] T062 [US8] Implementar o fluxo de exportação com `expo-file-system` (escrever o `.json`) +
      `expo-sharing` (compartilhar/salvar)
- [ ] T063 [US8] Implementar o fluxo de importação com `expo-document-picker` (selecionar o
      `.json`) + `validateBackupFile` antes de qualquer escrita no banco
- [ ] T064 [US8] Construir `app/(tabs)/backup/index.tsx` (Backup) conforme `Backup.dc.html`:
      botões Exportar/Importar
- [ ] T065 [US8] Construir `app/(tabs)/backup/confirmar-restauracao.tsx` (BackupConfirmar) conforme
      `BackupConfirmar.dc.html`: aviso explícito de substituição integral e irreversível antes de
      chamar `restoreAll`

**Checkpoint**: Todas as User Stories P1 (1, 2, 4, 8) completas — MVP pronto para uso.

---

## Phase 7: User Story 9 - Categorizar transações com ícones (Priority: P2)

**Goal**: Categorias pré-definidas + personalizadas como ícone de fallback (FR-027 a FR-030,
FR-037) — pré-requisito visual para US10 e US11.

**Independent Test**: conforme spec.md → User Story 9.

- [ ] T066 [P] [US9] Implementar `app/repositories/categoriesRepository.ts`: CRUD de Categoria
      personalizada; `deleteCategory` atualiza em lote `Compra.categoriaId = NULL` para todas as
      compras que a usavam (FR-037); nunca permite excluir uma Categoria com `predefinida = true`
- [ ] T067 [US9] Estender o formulário de Nova Compra (`app/(tabs)/cartoes/nova-compra/index.tsx`)
      para permitir escolher uma Categoria (predefinida ou personalizada) — campo opcional (FR-029)
- [ ] T068 [US9] Construir `app/(tabs)/categorias/index.tsx` (Categorias · Main): lista de
      predefinidas + personalizadas
- [ ] T069 [US9] Construir `app/(tabs)/categorias/nova.tsx` (CategoriaCriar): nome + escolha de
      ícone lucide entre os disponíveis (FR-028)
- [ ] T070 [P] [US9] Implementar `app/components/TransactionAvatar.tsx` com a ordem de prioridade
      **estabelecimento → categoria → ícone genérico "Outros"** (FR-030), para reuso em toda
      listagem de transações

**Checkpoint**: US9 completa; `TransactionAvatar` disponível para US3, US10 e US11.

---

## Phase 8: User Story 3 - Importar fatura via CSV (Priority: P2)

**Goal**: Importação de CSV genérico e Nubank com tags/comentários (FR-009, FR-010, FR-026).

**Independent Test**: `quickstart.md` → Cenário 6.

### Tests for User Story 3

- [ ] T071 [P] [US3] Testes unitários de `genericParser.parse` em
      `tests/unit/domain/csvImport/genericParser.test.ts`, usando um fixture
      `tests/fixtures/generic-sample.csv` (linhas válidas + ao menos uma linha sem data/valor para
      exercitar FR-026)
- [ ] T072 [P] [US3] Testes unitários de `nubankParser.parse` em
      `tests/unit/domain/csvImport/nubankParser.test.ts`, usando `tests/fixtures/nubank-sample.csv`
      — cobrindo: valor com vírgula e sinal negativo com espaço (`"- 15,92"`), título com aspas
      internas escapadas, padrão `Parcela N/M`, e exclusão da linha `"Pagamento recebido"`

### Implementation for User Story 3

- [ ] T073 [US3] Implementar `app/domain/csvImport/genericParser.ts` conforme
      `contracts/csv-import.md` (separador `;`, data `DD/MM/AAAA`, valor decimal com vírgula)
- [ ] T074 [US3] Implementar `app/domain/csvImport/nubankParser.ts` conforme
      `contracts/csv-import.md` e o formato confirmado em `research.md` (vírgula decimal,
      `"Pagamento recebido"` sempre excluído, créditos/estornos negativos importados como Compra de
      valor negativo)
- [ ] T075 [US3] Implementar `app/repositories/csvImportRepository.ts`: recebe um
      `CsvParseResult`, cria o `LoteImportacao`, persiste cada `CompraDraft` reaproveitando
      `purchasesRepository`/`splitInstallments` — sem caminho especial de persistência para dados
      importados
- [ ] T076 [US3] Construir `app/(tabs)/importar-csv/index.tsx` (ImportarCSV): escolher cartão de
      destino + formato + upload via `expo-document-picker`
- [ ] T077 [US3] Construir `app/(tabs)/importar-csv/resultado.tsx` (ImportarCSVResultado):
      contagem de linhas importadas/ignoradas com motivo (FR-026)
- [ ] T078 [US3] Estender a tela de edição de transação para permitir adicionar tags e comentário a
      uma transação importada (FR-007)

**Checkpoint**: US3 completa e testável de forma independente.

---

## Phase 9: User Story 5 - Sugestão de melhor cartão para comprar hoje (Priority: P2)

**Goal**: Ranquear cartões pelo prazo total até o vencimento da fatura correspondente (FR-012).

**Independent Test**: conforme spec.md → User Story 5.

- [ ] T079 [P] [US5] Testes unitários de `suggestBestCard` em `tests/unit/domain/bestCard.test.ts`:
      dois cartões com ciclos diferentes, cartão arquivado excluído do ranking (FR-025), empate
      exato resolvido por `criadoEm` mais antigo
- [ ] T080 [US5] Implementar `app/domain/bestCard/suggestBestCard.ts` conforme
      `contracts/best-card.md`
- [ ] T081 [P] [US5] Implementar o hook `app/hooks/useBestCard.ts`
- [ ] T082 [US5] Exibir a sugestão de melhor cartão na tela `app/(tabs)/index.tsx` (Início) e/ou no
      fluxo de Nova Compra, conforme `design-brief.md`

**Checkpoint**: US5 completa e testável de forma independente.

---

## Phase 10: User Story 6 - Assinaturas recorrentes e total mensal (Priority: P2)

**Goal**: Geração mensal automática e idempotente de cobranças de assinatura (FR-016 a FR-018).

**Independent Test**: conforme spec.md → User Story 6.

- [ ] T083 [P] [US6] Testes unitários de `pendingChargesFor` e `monthlySubscriptionsTotal` em
      `tests/unit/domain/subscriptions.test.ts`, incluindo o caso de idempotência (não gerar 2x no
      mesmo mês para a mesma assinatura)
- [ ] T084 [US6] Implementar `app/domain/subscriptions/pendingChargesFor.ts` e
      `app/domain/subscriptions/monthlySubscriptionsTotal.ts` conforme `contracts/subscriptions.md`
- [ ] T085 [US6] Implementar `app/repositories/subscriptionsRepository.ts`: CRUD de Assinatura;
      `generatePendingCharges()` cria a Compra (`origem = ASSINATURA`) + Parcela para cada
      `PendingCharge`, copiando forma de pagamento/cartão/categoria/tags **vigentes no momento da
      geração** (FR-017)
- [ ] T086 [US6] Disparar `generatePendingCharges()` em `app/_layout.tsx` (após as migrations) ou
      ao entrar nas telas de Início/Assinaturas
- [ ] T087 [US6] Construir `app/(tabs)/assinaturas/index.tsx` (Assinaturas · Main): lista de
      assinaturas ativas + total mensal somado (FR-018)
- [ ] T088 [US6] Construir `app/(tabs)/assinaturas/[subscriptionId].tsx` (AssinaturaEditar):
      editar nome/valor/forma de pagamento/dia — mudança de forma de pagamento só afeta gerações
      futuras, nunca reescreve cobranças já geradas (Edge Case)
- [ ] T089 [US6] Confirmar que uma assinatura paga via Pix desconta do saldo do mês (via
      `computeMonthBalance` da US2), não de uma fatura de cartão (FR-017, cenário 2)

**Checkpoint**: US6 completa e testável de forma independente.

---

## Phase 11: User Story 11 - Painel de estatísticas e comparação de consumo (Priority: P2)

**Goal**: Estatísticas por período com comparação, categoria, maiores gastos e meta ideal (FR-038
a FR-045). Depende de US1, US2 e US9 já existirem.

**Independent Test**: conforme spec.md → User Story 11.

### Tests for User Story 11

- [ ] T090 [P] [US11] Testes unitários de `resolvePeriod`, `totalSpent`, `compareToPrevious` em
      `tests/unit/domain/statistics.test.ts`, incluindo o caso "sem dado do período anterior" —
      indicar ausência de comparação em vez de uma variação incorreta (FR-041 Edge Case)
- [ ] T091 [P] [US11] Testes unitários de `spendingByCategory`, `topExpenses`,
      `subscriptionsShare`, `idealSpendComparison` em `tests/unit/domain/statistics.test.ts`,
      incluindo o caso "sem renda/meta configurada" (FR-042 Edge Case)

### Implementation for User Story 11

- [ ] T092 [US11] Implementar `app/domain/statistics/resolvePeriod.ts`,
      `app/domain/statistics/totalSpent.ts`, `app/domain/statistics/compareToPrevious.ts`
      conforme `contracts/statistics.md`
- [ ] T093 [US11] Implementar `app/domain/statistics/spendingByCategory.ts`,
      `app/domain/statistics/topExpenses.ts`, `app/domain/statistics/subscriptionsShare.ts`,
      `app/domain/statistics/idealSpendComparison.ts` conforme `contracts/statistics.md`
- [ ] T094 [US11] Implementar `app/repositories/statisticsRepository.ts` e
      `app/repositories/idealGoalRepository.ts` (CRUD da `MetaConsumoIdeal` singleton)
- [ ] T095 [P] [US11] Implementar o hook `app/hooks/useStatistics.ts`
- [ ] T096 [US11] Construir o gráfico de consumo mensal em `app/(tabs)/index.tsx` (Início)
      conforme `Main.dc.html`, tocável para abrir a tela de Estatísticas
- [ ] T097 [US11] Construir `app/(tabs)/estatisticas.tsx` (Estatísticas) conforme
      `Estatisticas.dc.html`: seletor de período (Diário/Semanal/Mensal/Anual), total + comparação,
      gasto por categoria, maiores gastos, % de assinaturas, seção de meta ideal (condicional a
      haver renda **e** meta configuradas)
- [ ] T098 [US11] Construir a configuração de Meta de Consumo Ideal (percentual da renda mensal
      vigente) integrada à tela de Estatísticas ou Renda, conforme `design-brief.md`

**Checkpoint**: US11 completa e testável de forma independente.

---

## Phase 12: User Story 12 - Dividir compras com outras pessoas (Priority: P2)

**Goal**: Responsabilidade de compra diferente do total, sem alterar fatura/saldo (FR-046 a
FR-055). Depende de US1, US4 e US11 já existirem.

**Independent Test**: `quickstart.md` → Cenário 5.

### Tests for User Story 12

- [ ] T099 [P] [US12] Testes unitários de `validateManualResponsibility`,
      `requiresMotivoResponsavelFields`, `shouldShowResponsibilitySummary` em
      `tests/unit/domain/expenseSplitting.test.ts` — **`0 ≤ valorResponsabilidade ≤
      valorTotalOriginal`** (FR-048)
- [ ] T100 [P] [US12] Testes unitários de `recomputeSplitOnRefund` em
      `tests/unit/domain/installments.test.ts`: sem entrada vinculada, uma entrada, múltiplas
      entradas (soma subtraída do total), entrada desvinculada volta ao valor manual (se houver)
      ou ao total (Edge Cases)

### Implementation for User Story 12

- [ ] T101 [US12] Implementar `app/domain/expenseSplitting/validateManualResponsibility.ts`,
      `requiresMotivoResponsavelFields.ts`, `shouldShowResponsibilitySummary.ts` conforme
      `contracts/expense-splitting.md`
- [ ] T102 [US12] Implementar `app/domain/installments/recomputeSplitOnRefund.ts` conforme
      `contracts/installments.md`, e integrá-la à proporção usada em `splitInstallments` — mesma
      fração de responsabilidade aplicada em cada parcela (FR-055)
- [ ] T103 [US12] Estender `app/repositories/cashEntriesRepository.ts`: suportar
      `compraVinculadaId` ao criar/editar/excluir uma EntradaAvulsa, disparando
      `recomputeSplitOnRefund` e atualizando `Parcela.valorResponsabilidade` de todas as parcelas
      da Compra afetada — **o valor calculado a partir de entradas vinculadas sempre prevalece
      sobre um valor manual** (FR-051)
- [ ] T104 [US12] Estender `app/repositories/purchasesRepository.ts`: suportar
      `valorResponsabilidade`/`motivo`/`responsavel` na criação/edição de Compra, validando com
      `validateManualResponsibility`
- [ ] T105 [US12] Construir `app/(tabs)/cartoes/nova-compra/divisao-manual.tsx`
      (NovaCompraDivisaoManual) conforme `NovaCompraDivisaoManual.dc.html`
- [ ] T106 [US12] Construir `app/(tabs)/cartoes/nova-compra/divisao-vinculada.tsx`
      (NovaCompraDivisaoVinculada) conforme `NovaCompraDivisaoVinculada.dc.html`
- [ ] T107 [US12] Exibir o resumo "Você paga: R$ X" em `FaturaDetalhe.tsx` e `CartaoDetalhe.tsx`
      usando `shouldShowResponsibilitySummary` — **nunca altera o valor total exibido da fatura**
      (FR-052, FR-053)
- [ ] T108 [US12] Confirmar que `domain/statistics` (US11) usa `responsabilidadeEfetiva` em vez de
      `valor` em `totalSpent`/`spendingByCategory`/`topExpenses` (FR-054); adicionar um caso de
      teste com uma compra dividida em `tests/unit/domain/statistics.test.ts`

**Checkpoint**: US12 completa e testável de forma independente.

---

## Phase 13: User Story 10 - Mapear estabelecimentos conhecidos com avatar (Priority: P3)

**Goal**: Reconhecimento automático de estabelecimento por padrão de texto + avatar, com busca
opcional de logotipo (FR-031 a FR-036). Depende de US9 e US3 já existirem.

**Independent Test**: conforme spec.md → User Story 10.

### Tests for User Story 10

- [ ] T109 [P] [US10] Testes unitários de `matchEstablishment`, `reevaluateUnassignedTransactions`,
      `suggestInitialPattern` em `tests/unit/domain/establishmentMatching.test.ts` — desempate por
      padrão mais longo e depois por `estabelecimentoCriadoEm` mais antigo (Assumption)

### Implementation for User Story 10

- [ ] T110 [US10] Implementar `app/domain/establishmentMatching/matchEstablishment.ts`,
      `reevaluateUnassignedTransactions.ts`, `suggestInitialPattern.ts` conforme
      `contracts/establishment-matching.md`
- [ ] T111 [US10] Implementar `app/repositories/establishmentsRepository.ts`: CRUD de
      Estabelecimento + PadraoReconhecimento; ao adicionar um padrão, chamar
      `reevaluateUnassignedTransactions` e atualizar as Compras retornadas — **nunca sobrescrevendo
      uma associação com `estabelecimentoManual = true`** (FR-034, FR-035)
- [ ] T112 [US10] Integrar `matchEstablishment` em `purchasesRepository.createPurchase` e
      `csvImportRepository` — toda Compra nova ou importada passa pelo matching automático (FR-033)
- [ ] T113 [US10] Implementar a busca best-effort de logotipo via Brandfetch CDN
      (`https://cdn.brandfetch.io/{domain}`) + cache local via `expo-file-system`, salvando em
      `Estabelecimento.logoCachePath`; falha/timeout/offline **nunca bloqueia** e sempre recai no
      `iconeRespaldo` (FR-036, Princípio I)
- [ ] T114 [US10] Construir `app/(tabs)/estabelecimentos/index.tsx` (EstabelecimentosLista)
- [ ] T115 [US10] Construir `app/(tabs)/estabelecimentos/[establishmentId].tsx`
      (EstabelecimentoDetalhe): nome, ícone de respaldo (obrigatório), domínio opcional, lista de
      padrões
- [ ] T116 [US10] Construir a criação de estabelecimento inline a partir da edição de uma
      transação (`app/(tabs)/cartoes/nova-compra/estabelecimento.tsx`,
      `NovaCompraEstabelecimento.dc.html`), sugerindo o padrão inicial via `suggestInitialPattern`
      (FR-032)
- [ ] T117 [US10] Atualizar `TransactionAvatar` (US9) para preferir `logoCachePath` >
      `iconeRespaldo` > categoria > "Outros" (FR-030)

**Checkpoint**: US10 completa e testável de forma independente.

---

## Phase 14: User Story 7 - Reservas de dinheiro guardado com rendimento (Priority: P3)

**Goal**: Reservas com depósitos, retiradas e rendimento manual; taxa configurável apenas
cadastrada, sem aplicação automática (FR-019 a FR-021).

**Independent Test**: conforme spec.md → User Story 7.

- [ ] T118 [P] [US7] Implementar `app/repositories/reservesRepository.ts`: CRUD de Reserva; saldo
      **sempre derivado** como soma de `LancamentoReserva.valor` (nunca uma coluna própria)
- [ ] T119 [US7] Implementar `app/repositories/reserveEntriesRepository.ts`: criar
      `LancamentoReserva` do tipo `DEPOSITO`, `RETIRADA` ou `RENDIMENTO_MANUAL`; **nenhum código
      gera `RENDIMENTO_AUTOMATICO` nesta versão** (Princípio V / Assumption)
- [ ] T120 [US7] Construir `app/(tabs)/reservas/index.tsx` (Reservas · Main): lista de reservas +
      saldo de cada uma
- [ ] T121 [US7] Construir `app/(tabs)/reservas/[reserveId].tsx` (ReservaDetalhe): saldo, taxa de
      rendimento mensal configurada (exibida, **não aplicada automaticamente** — FR-021), histórico
      de lançamentos, formulário de novo lançamento manual

**Checkpoint**: Todas as 12 User Stories completas e independentemente funcionais.

---

## Phase 15: Polish & Cross-Cutting Concerns

**Purpose**: Validação final e qualidade transversal a todas as stories.

- [ ] T122 [P] Rodar `quickstart.md` de ponta a ponta em um dispositivo Android real via Expo Go,
      conferindo os 7 cenários
- [ ] T123 [P] Revisão de contraste/acessibilidade da implementação real contra os tokens
      validados em `design-brief.md` (WCAG já computado na fase de design — confirmar que os
      componentes Tamagui construídos batem com esses valores)
- [ ] T124 [P] Testes de integração em `tests/integration/` (on-device) para: migrations rodando
      do zero em um banco limpo, e round-trip completo de backup export→import (FR-024)
- [ ] T125 Medir tempo de boot+migrations e tempo de abertura das listagens principais contra as
      metas do Technical Context (`plan.md`: <500ms boot, <100ms listagens)
- [ ] T126 [P] Revisar cada tela construída contra os canvases aprovados em `design-brief.md`
      para fidelidade visual
- [ ] T127 Revisão final da Constitution Check (`plan.md`) contra o código entregue: confirmar que
      nenhuma chamada de rede além da busca de logotipo Brandfetch foi introduzida, e que ela
      permanece best-effort/não-bloqueante
- [ ] T128 Registrar em `specs/001-personal-finance-tracker/checklists/requirements.md` a entrada
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
Task: "Implementar app/repositories/cardsRepository.ts"
Task: "Implementar os hooks app/hooks/useCards.ts e app/hooks/useInvoice.ts"
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
