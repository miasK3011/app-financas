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

## Decisão: Formato do CSV do Nubank (CONFIRMADO com arquivo real)

- **Status**: Validado contra um arquivo de exportação real fornecido pelo usuário em
  2026-09-17 (mantido apenas localmente, fora do git — ver `tests/fixtures/nubank-sample.csv` para
  uma versão anonimizada com a mesma estrutura). A suposição original da spec acertou o cabeçalho e
  o formato de data, mas **errou o formato de número**; corrigido abaixo.
- **Decision — formato confirmado**:
  - Cabeçalho exato: `date,title,amount`.
  - `date`: `YYYY-MM-DD`.
  - `amount`: **string entre aspas, decimal com VÍRGULA (formato BRL)**, não com ponto — ex.:
    `"152,39"`. Valores negativos vêm com um `-` seguido de **um espaço** antes do número, ainda
    dentro das aspas — ex.: `"- 15,92"`. O parser deve: remover aspas (o `papaparse` já faz isso),
    remover todo espaço em branco interno, tratar um `-` inicial como sinal negativo, trocar `,`
    por `.` (e remover `.` de milhar, se houver, antes disso) e então converter para centavos.
  - `title`: texto livre, podendo conter aspas internas escapadas no padrão CSV (`""`) — ex.:
    `"Crédito de ""MP *ALIEXPRESS"""` — o `papaparse` decodifica isso automaticamente para o texto
    literal `Crédito de "MP *ALIEXPRESS"`, confirmando que essa era a biblioteca certa para não
    reimplementar escaping de CSV manualmente.
  - Parcelamento: confirmado o padrão textual `<descrição> - Parcela N/M` no final do `title` (ex.:
    `Autopecas Silva - Parcela 1/3`, `MercadoOnline*Loja Xyz - Parcela 1/4`) — a estratégia da
    versão anterior desta decisão (cada linha vira uma `Compra` com `parcelasTotal = M`,
    `parcelaAtual = N`, reaproveitando o fluxo de "parcelamento já em andamento" do FR-004)
    continua válida e não precisou de ajuste.
  - **Valores negativos são reais e frequentes** no extrato do Nubank, em três formas observadas:
    (1) a linha `Pagamento recebido` — registra o pagamento da fatura anterior, **não é uma
    compra** e deve ser **sempre excluída** da importação (vai para `skipped`, mas com um motivo
    informativo, não de erro: `"Pagamento de fatura anterior — não é uma compra"`); (2) estornos/
    créditos nomeados (ex.: `Crédito de "MP *ALIEXPRESS"`) — importados normalmente como uma
    `Compra` de valor **negativo**, que reduz o total da fatura corretamente ao ser somada em
    `computeInvoiceTotals` (FR-011), sem precisar de nenhum tratamento especial; (3) pares de
    estorno/nova cobrança do mesmo estabelecimento no mesmo dia (ex.: `Uber - NuPay` com `-15,50`
    seguido de `+15,50`) — importados como duas `Compra`s independentes, exatamente como aparecem
    no CSV, sem tentar deduplicar ou compensar — é o comportamento real do banco e deve ser
    espelhado fielmente.
- **Rationale**: A spec já previa o cabeçalho e o padrão de parcelas corretamente; o formato de
  número (vírgula, não ponto) é a única correção material, e é exatamente o tipo de ajuste local e
  barato que a decisão original antecipava ("qualquer ajuste de coluna/formato seja uma mudança
  local e barata" — mantido, o parser é isolado e coberto por fixture). Tratar `Pagamento recebido`
  como exclusão e créditos/estornos como `Compra` de valor negativo evita inflar artificialmente o
  total da fatura ou perder informação real do extrato.
- **Impacto no `data-model.md`**: `Compra.valorTotalOriginal` pode ser **negativo** quando
  `origem = CSV_IMPORT` e a linha original era um crédito/estorno (não se aplica a compras
  cadastradas manualmente, onde o formulário sempre exige valor positivo). `Parcela.valor` herda o
  mesmo sinal; `responsabilidadeEfetiva` para essas linhas continua sendo o padrão (= o próprio
  valor, já que ninguém divide um estorno com outra pessoa) sem exigir mudança na fórmula.
- **Alternatives considered**: Ignorar todas as linhas negativas do CSV — rejeitado por descartar
  estornos reais que afetam o total correto da fatura; tentar compensar/casar pares de estorno
  automaticamente — rejeitado por complexidade desnecessária (YAGNI) quando simplesmente importar
  cada linha como está já produz o total correto.

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
