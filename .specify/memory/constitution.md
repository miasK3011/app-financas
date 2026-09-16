<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0
- Modified principles: I. Offline-First Absoluto → I. Offline-First (Núcleo Sempre Funcional Sem Rede)
  — relaxa a proibição total de rede para permitir funcionalidades de enriquecimento opcionais e
  não-bloqueantes (ex.: busca de logotipo de marca), desde que o app permaneça 100% utilizável
  offline e nenhuma funcionalidade essencial dependa de conectividade.
- Added sections: none (Technology Stack Constraints atualizado para refletir a exceção)
- Removed sections: n/a
- Follow-up TODOs: none
-->

# App de Finanças Pessoais Constitution

## Core Principles

### I. Offline-First (Núcleo Sempre Funcional Sem Rede)
O app é utilizável 100% sem conexão de rede, para uso individual do dono do dispositivo. Toda
funcionalidade essencial — registrar compras, calcular faturas, acompanhar saldo do mês,
assinaturas, reservas e o backup/restauração local — DEVE continuar funcionando integralmente
sem internet. NÃO DEVE existir, em nenhuma feature, presente ou futura: backend remoto próprio,
servidor de sincronização, autenticação ou login. Toda leitura e escrita de dados do usuário
ocorre exclusivamente no armazenamento local do próprio dispositivo.

Funcionalidades pontuais de enriquecimento OPCIONAL podem fazer chamadas de rede best-effort a
serviços externos (ex.: buscar o logotipo oficial de uma marca), desde que cumpram todas as
regras abaixo:

- NUNCA bloqueiem, atrasem perceptivelmente, ou sejam pré-requisito para qualquer outra
  funcionalidade do app — o app permanece 100% operável sem elas;
- O resultado obtido é armazenado em cache local para reuso imediato quando offline;
- A ausência de conexão ou uma falha na chamada sempre resulta em um fallback funcional local
  (ex.: um ícone escolhido manualmente), nunca em erro ou tela bloqueada;
- Não introduzem login, conta de usuário ou qualquer identidade vinculada a um serviço externo.

Qualquer proposta de feature que dependa de conectividade para funcionar (não apenas para se
enriquecer) — ex.: sincronização multi-dispositivo, integração bancária online — é rejeitada por
padrão, a menos que uma emenda futura a esta constituição reavalie explicitamente este princípio.

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
- Nenhuma dependência de serviço externo para telemetria, analytics, crash reporting remoto ou
  feature flags remotos pode ser adicionada — isso violaria o Princípio I.
- Integrações de rede só são permitidas para enriquecimento opcional de dados já existentes
  localmente (ex.: busca de logotipo de marca), nunca como pré-requisito de uma funcionalidade;
  devem seguir as regras de cache/fallback do Princípio I e ser justificadas no plano técnico
  (`plan.md`) da feature correspondente antes de serem implementadas.

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

**Version**: 1.1.0 | **Ratified**: 2026-09-15 | **Last Amended**: 2026-09-15
