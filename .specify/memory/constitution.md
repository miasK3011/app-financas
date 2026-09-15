<!--
Sync Impact Report
- Version change: (none) → 1.0.0
- Modified principles: n/a (initial ratification)
- Added sections: Core Principles (I-V), Technology Stack Constraints, Development Workflow, Governance
- Removed sections: n/a
- Follow-up TODOs: none
-->

# App de Finanças Pessoais Constitution

## Core Principles

### I. Offline-First Absoluto
O app funciona 100% sem conexão de rede, para uso individual do dono do dispositivo.
NÃO DEVE existir chamada de rede, backend remoto, servidor de sincronização, autenticação
ou login em nenhuma feature, presente ou futura. Toda leitura e escrita de dados ocorre
exclusivamente no armazenamento local do próprio dispositivo. Qualquer proposta de feature
que dependa de conectividade (ex.: sincronização multi-dispositivo, integração bancária
online) é rejeitada por padrão, a menos que uma emenda futura a esta constituição
reavalie explicitamente este princípio.

### II. Stack Tecnológica Fixa
A stack do projeto é: React Native com Expo (managed workflow), Tamagui como biblioteca
de componentes de UI, e Drizzle ORM sobre `expo-sqlite` para persistência local. Nenhuma
biblioteca concorrente nessas categorias (outro UI kit, outro ORM, outro driver de banco)
deve ser introduzida sem uma emenda explícita a esta constituição justificando a troca.
Manter a stack fixa reduz retrabalho e mantém a base de código coesa para um projeto
mantido por uma única pessoa.

### III. Android-Only Nesta Fase
Android é a única plataforma suportada. Suporte a iOS está fora de escopo e NÃO DEVE
influenciar decisões de arquitetura, UI ou empacotamento nesta fase. Código que dependa
de comportamento específico de iOS não deve ser escrito preventivamente; se o suporte a
iOS for adotado no futuro, isso exigirá uma emenda a este princípio.

### IV. Integridade e Portabilidade dos Dados (NÃO-NEGOCIÁVEL)
Os dados financeiros do usuário são o ativo mais importante do sistema. Toda mudança de
schema do banco local DEVE ser versionada via migration e NUNCA DEVE ser destrutiva sem
um caminho de migração explícito preservando os dados existentes. A funcionalidade de
exportação e importação de um backup local completo dos dados é um requisito de primeira
classe do produto — não uma feature opcional a ser adiada — precisamente porque o app
não possui login nem sincronização em nuvem, tornando o backup local a única proteção
contra perda de dados ao trocar ou reinstalar o aplicativo.

### V. Simplicidade e Escopo Enxuto (YAGNI)
O projeto evita abstrações especulativas além do que foi explicitamente combinado.
NÃO DEVE haver integrações bancárias reais (open finance, scraping de extratos),
sincronização multi-dispositivo, ou motores de automação em background que dependam do
app rodando 24/7. Quando uma feature futura é planejada mas ainda não implementada (ex.:
aplicação automática mensal de rendimento sobre reservas de dinheiro guardado), o modelo
de dados pode antecipar essa necessidade, mas a lógica de execução automática só é
construída quando a feature for formalmente especificada e priorizada.

## Technology Stack Constraints

- Runtime: Expo (managed workflow); evitar ejetar para bare workflow ou introduzir
  dependências nativas que exijam dev client customizado, a menos que estritamente
  necessário e justificado no plano técnico da feature correspondente.
- UI: Tamagui é a única biblioteca de componentes; estilização deve seguir o sistema de
  tokens/temas do Tamagui em vez de estilos ad-hoc dispersos.
- Persistência: Drizzle ORM + `expo-sqlite`. Migrations são geradas via `drizzle-kit` e
  aplicadas no boot do app antes de renderizar a navegação principal.
- Nenhuma dependência de serviço externo (analytics, crash reporting remoto, feature
  flags remotos, etc.) pode ser adicionada, pois violaria o Princípio I.

## Development Workflow

Este é um projeto de uso pessoal, mantido por uma única pessoa (o próprio usuário/dono
do app), sem equipe, sem processo formal de release ou revisão por terceiros. O fluxo de
trabalho é spec-driven usando o GitHub Spec Kit: toda feature nova passa por
`/speckit-specify` (especificação funcional) e `/speckit-plan` (plano técnico) antes de
`/speckit-implement`. Mudanças que contradigam algum dos Princípios I-V acima exigem uma
emenda explícita a esta constituição antes de prosseguir.

## Governance

Esta constituição tem precedência sobre qualquer prática de desenvolvimento ad-hoc.
Emendas são feitas pelo próprio usuário/mantenedor via `/speckit-constitution`, incluem
justificativa da mudança e atualizam o número de versão conforme versionamento semântico:
MAJOR para remoção ou redefinição incompatível de um princípio existente; MINOR para
adição de um novo princípio ou expansão material de uma seção existente; PATCH para
esclarecimentos, correções de texto ou refinamentos não-semânticos. Especificações
(`spec.md`) e planos técnicos (`plan.md`) gerados pelo Spec Kit devem ser consistentes
com os princípios aqui definidos; qualquer inconsistência descoberta durante
`/speckit-analyze` deve ser resolvida atualizando a spec/plano ou emendando esta
constituição, nunca ignorada silenciosamente.

**Version**: 1.0.0 | **Ratified**: 2026-09-15 | **Last Amended**: 2026-09-15
