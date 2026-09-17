# Phase 0 Research: Controle Financeiro Pessoal — Núcleo

Todas as incertezas técnicas levantadas pelo Technical Context e pela seção Assumptions do
`spec.md` são resolvidas abaixo. Nenhum item permanece como `NEEDS CLARIFICATION`.

## Decisão: Estratégia de testes sem backend/API

- **Decision**: Toda a lógica de negócio crítica (motores de fatura, parcelamento, melhor cartão,
  assinatura, estatísticas, divisão de responsabilidade, matching de estabelecimento, parsers de
  CSV, serialização de backup) é escrita em `app/domain/**` como TypeScript puro — funções e
  classes sem import de `react`, `react-native` ou `drizzle-orm`. Essas funções recebem dados já
  carregados (arrays de entidades simples) e devolvem resultados/decisões, nunca acessam o banco
  diretamente. Essa camada é testada com Jest comum (`jest-expo` preset), rodando em Node, sem
  device e sem runtime SQLite.
- **Rationale**: `expo-sqlite` só executa dentro do runtime Expo/React Native (JSI), não em Node
  puro — não dá para instanciar um banco real em testes Jest de CI sem um device/simulador. Como o
  app não tem backend, a maior parte do valor de teste automatizado está nas regras de negócio
  (matemática de fechamento/vencimento, divisão de parcelas e de responsabilidade, ranking de
  melhor cartão, parsing de CSV) — que são puras por natureza e não precisam do banco para serem
  verificadas.
- **Alternatives considered**: (a) Testar tudo via Detox/Maestro em um device/emulador Android —
  mantido apenas para os testes de integração dos repositórios e do fluxo de migrations (poucos
  cenários, caros de rodar); (b) usar `better-sqlite3` no lugar do `expo-sqlite` só nos testes — 
  rejeitado por introduzir um segundo driver de banco divergente do runtime real, violando o
  espírito do Princípio II (stack fixa); (c) não testar a camada de repositório automatizada
  nenhuma vez — rejeitado por FR-011/FR-015 (somas de fatura/saldo) serem críticos o bastante para
  justificar ao menos os testes de integração manuais descritos em `quickstart.md`.

## Decisão: Migrations do Drizzle no boot do Expo

- **Decision**: Gerar migrations com `drizzle-kit generate` (dialect `sqlite`) a partir de
  `app/db/schema.ts`; a pasta `drizzle/` resultante é importada como módulo estático (Metro empacota
  os arquivos `.sql`/`journal.json` gerados) e aplicada com o hook `useMigrations` de
  `drizzle-orm/expo-sqlite/migrator` dentro de `app/_layout.tsx`, exibindo uma tela de loading até
  a migration terminar, antes de montar qualquer navegação.
- **Rationale**: É o caminho documentado e mantido pela própria Drizzle para Expo + `expo-sqlite`,
  evita escrever SQL de migration à mão, e mantém migrations versionadas em git (Princípio IV —
  nenhuma mudança de schema é destrutiva sem caminho de migração).
- **Alternatives considered**: Rodar `CREATE TABLE IF NOT EXISTS` manual a cada boot — rejeitado por
  não suportar evolução de schema (ex.: adicionar uma coluna) sem perda de dados; usar
  `expo-sqlite/kv-store` em vez de um schema relacional — rejeitado por não suportar as relações e
  agregações (somas de fatura, joins de parcela↔fatura) exigidas pelas FR-011/FR-015.

## Decisão: Formato do CSV do Nubank

- **Decision**: O parser Nubank (`app/domain/csvImport/nubankParser.ts`) assume o formato de
  exportação de fatura de cartão do Nubank publicamente documentado: cabeçalho exato
  `date,title,amount`, separador vírgula, `date` no formato `YYYY-MM-DD`, `amount` decimal com
  ponto (positivo = despesa), e `title` livre — podendo conter o padrão textual `Parcela N/M` para
  compras parceladas (ex.: `Uber - Parcela 2/3`). Quando esse padrão é detectado no título, o
  parser reconstrói a compra original agrupando linhas do mesmo título-base (texto antes de
  " - Parcela") que aparecem em faturas diferentes seria ideal, mas como o Nubank exporta apenas
  uma fatura por arquivo, a estratégia adotada é: cada linha com `Parcela N/M` vira uma `Compra`
  independente com `installmentsCount = M` e `currentInstallment = N`, reaproveitando exatamente o
  mesmo mecanismo do FR-004 (parcelamento já em andamento) — sem tentar unir linhas de arquivos de
  meses diferentes automaticamente.
- **Rationale**: A spec já registrava essa suposição em Assumptions (formato `date,title,amount`,
  parcelas identificadas por padrão textual). Tratar cada linha `Parcela N/M` como uma "compra em
  andamento" reaproveita a User Story 4 sem exigir uma segunda estrutura de dados — e é seguro
  porque, se o usuário importar faturas de meses consecutivos, cada uma cria a parcela daquele mês
  isoladamente sem duplicar valor (a parcela N/M vira uma Compra com 1 parcela restante alocada
  naquele mês; ver `contracts/csv-import.md`).
- **Ainda pendente de validação com dado real**: Este formato é o publicamente conhecido, mas
  ainda **não foi confirmado com um arquivo de exportação real do usuário**, como a spec já sinalizava.
  **Ação de acompanhamento**: a primeira tarefa de implementação do parser Nubank (em `tasks.md`)
  deve incluir "validar/ajustar contra um CSV real exportado pelo usuário" como critério de
  aceite explícito, e o parser deve ser escrito de forma isolada e coberta por testes de unidade
  com fixtures, para que qualquer ajuste de coluna/formato seja uma mudança local e barata.
- **Alternatives considered**: Bloquear o planejamento até o usuário fornecer o arquivo real —
  rejeitado por não ser necessário bloquear todo o `/plan` por causa de um único parser isolado e
  substituível; a spec já previa seguir com a suposição documentada.

## Decisão: Busca de logotipo (Brandfetch) sem backend

- **Decision**: Usar o serviço público de logotipo por domínio da Brandfetch
  (`https://cdn.brandfetch.io/{domain}`) como fonte best-effort de imagem, baixando o resultado com
  `fetch` + `expo-file-system` para o diretório de cache do app quando uma busca é disparada
  (usuário informa/edita o domínio de um Estabelecimento e há conexão disponível), salvando o
  caminho do arquivo local em `Estabelecimento.logoCachePath`. Falha de rede, timeout ou resposta
  não-imagem faz o app silenciosamente manter o ícone de respaldo — nunca lança erro visível.
- **Rationale**: Não exige backend próprio nem gerenciamento de chave de API para o caso de uso
  mínimo (uma imagem por domínio), respeitando o Princípio I (rede só para enriquecimento, nunca
  bloqueante) e o Princípio V (sem infraestrutura extra). O resultado cacheado localmente garante
  uso offline subsequente (FR-036).
- **Alternatives considered**: Brandfetch Brand API completa (dados estruturados, exige API key) —
  rejeitada por ser mais poder do que o necessário (só precisamos da imagem do logotipo) e por
  introduzir gestão de credencial para um app sem backend; Clearbit Logo API — mesma categoria de
  solução, mas descontinuada publicamente para uso não autenticado; deixar de buscar logotipo e
  usar só ícone manual — rejeitado por já ter sido especificado e confirmado pelo usuário (FR-036,
  User Story 10).

## Decisão: Navegação com `expo-router` mapeada 1:1 ao design-brief

- **Decision**: Usar `expo-router` (roteamento por arquivo) com a árvore de rotas descrita em
  `plan.md` → Project Structure, espelhando exatamente os 6 canvases e ~19 artboards do
  `design-brief.md` (Início/Estatísticas, Cartões/Compra, Renda/Backup, Assinaturas/CSV,
  Categorias/Estabelecimentos, Reservas).
- **Rationale**: Elimina uma camada de configuração de navegação manual (React Navigation puro),
  mantém uma URL/rota previsível por tela para debug, e é a opção first-party recomendada pelo
  time do Expo para managed workflow.
- **Alternatives considered**: React Navigation configurado manualmente — mais controle, mas mais
  boilerplate sem benefício claro para este escopo; nenhuma outra lib de navegação é considerada
  (não concorre com a stack fixa da constituição, que não menciona navegação explicitamente, mas
  `expo-router` é o padrão do próprio Expo).

## Decisão: Formulários e validação

- **Decision**: `react-hook-form` para estado de formulário (cartão, compra, assinatura, reserva,
  estabelecimento) + `zod` para schemas de validação, incluindo as regras de negócio que também são
  regras de formulário (FR-005 parcela atual ≤ total; FR-048 responsabilidade entre 0 e o total da
  compra).
- **Rationale**: Combinação padrão de mercado para React/React Native, minimiza reimplementação de
  validação e mantém as mensagens de erro (ex.: "parcela atual não pode ser maior que o total")
  centralizadas e testáveis como parte do schema `zod`, que pode ser reaproveitado dentro de
  `app/domain/**` (os mesmos schemas validam tanto o formulário quanto a entrada de dados vinda do
  CSV/backup).
- **Alternatives considered**: Formulários não controlados com validação manual em cada tela —
  rejeitado por duplicar lógica de validação em 8+ telas de formulário do design-brief.

## Decisão: Parsing de CSV

- **Decision**: `papaparse` (puro JS, sem dependência nativa) para tokenizar as linhas do CSV
  genérico e do Nubank; a lógica de reconhecimento de coluna/formato específico de cada fonte fica
  em `app/domain/csvImport/{generic,nubank}Parser.ts`, ambos implementando a mesma interface
  (`parse(rawCsv: string): { imported: CompraDraft[]; skipped: SkippedRow[] }`) descrita em
  `contracts/csv-import.md`.
- **Rationale**: `papaparse` é puro JavaScript (funciona no runtime Hermes do Expo sem módulo
  nativo), amplamente usado, e lida corretamente com edge cases de CSV (aspas, vírgulas dentro de
  campos) que um `split(',')` manual quebraria.
- **Alternatives considered**: Parser manual via `split`/regex — rejeitado por ser frágil diante de
  variações de aspas/escaping; `csv-parse` (Node-oriented, depende de streams Node) — rejeitado por
  exigir polyfills extras no runtime React Native sem necessidade.

## Decisão: Backup local (exportar/importar)

- **Decision**: O backup é um único arquivo JSON (`.json`) contendo `{ schemaVersion, exportedAt,
  data: { cartoes, faturas, compras, parcelas, tags, assinaturas, configuracoesRenda,
  entradasAvulsas, reservas, lancamentosReserva, categorias, estabelecimentos,
  padroesReconhecimento, metaConsumoIdeal } }`, serializado a partir de uma leitura completa de
  todas as tabelas via repositórios. Exportação usa `expo-file-system` para escrever o arquivo em
  cache e `expo-sharing` para o usuário salvar/compartilhar; importação usa
  `expo-document-picker` para selecionar o arquivo, valida `schemaVersion` e a forma geral do JSON
  antes de aplicar, e substitui integralmente os dados atuais dentro de uma transação Drizzle
  (`db.transaction`) — nunca mescla parcialmente (conforme FR-024 e a Assumption correspondente).
- **Rationale**: JSON é legível, versionável, fácil de validar antes de aplicar e não exige
  bibliotecas de compressão/formato binário para o volume de dados esperado (uso pessoal). Uma
  transação única garante que uma restauração nunca deixe o banco em estado parcialmente
  substituído se falhar no meio.
- **Alternatives considered**: Backup binário do próprio arquivo SQLite (copiar o arquivo `.db`) —
  mais simples de implementar, mas acopla o formato de backup à versão interna do SQLite/Drizzle e
  dificulta uma futura migração de schema entre versões de backup distintas; formato comprimido
  (zip) — desnecessário para o volume de dados esperado, adiado até virar um problema real (YAGNI).

## Decisão: Identificadores e datas

- **Decision**: IDs de todas as entidades são UUIDs gerados via `expo-crypto` (`randomUUID`); datas
  são armazenadas como inteiro Unix timestamp (ms) em colunas SQLite, manipuladas com `date-fns`
  (`addMonths`, `setDate`, `lastDayOfMonth` para o clamp de dia 29/30/31 em meses curtos — Edge
  Case da spec).
- **Rationale**: UUID evita coordenação de auto-incremento entre importação de backup e inserções
  normais (um backup restaurado não colide com IDs já usados); `date-fns` é leve, tree-shakeable e
  cobre exatamente as operações de calendário necessárias para fechamento/vencimento/clamp de mês
  curto sem reimplementar aritmética de datas manualmente.
- **Alternatives considered**: IDs auto-incrementais do SQLite — rejeitado pelo risco de colisão ao
  restaurar um backup sobre um banco que já teve inserções; `moment.js` — descontinuado/pesado
  comparado a `date-fns`.

## Resumo de dependências novas a adicionar ao projeto

| Pacote | Uso |
|---|---|
| `expo-router` | Navegação por arquivo |
| `@tamagui/core`, `@tamagui/config`, `tamagui` | UI (já decidido na constituição) |
| `drizzle-orm`, `drizzle-kit` | ORM + geração de migrations (já decidido na constituição) |
| `expo-sqlite` | Driver de banco local (já decidido na constituição) |
| `lucide-react-native`, `react-native-svg` | Ícones (já confirmado com o usuário) |
| `date-fns` | Aritmética de datas/calendário |
| `react-hook-form`, `zod` | Formulários e validação |
| `papaparse` | Parsing de CSV |
| `expo-file-system`, `expo-sharing`, `expo-document-picker` | Backup export/import, upload de CSV |
| `expo-crypto` | Geração de UUID |
| `jest-expo`, `@testing-library/react-native` | Testes |
