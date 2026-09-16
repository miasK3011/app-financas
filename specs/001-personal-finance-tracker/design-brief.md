# Design Brief — Controle Financeiro Pessoal (para Claude Design)

**Relacionado a**: [spec.md](./spec.md) (feature `001-personal-finance-tracker`)
**Criado**: 2026-09-15
**Status**: Draft — a refinar durante a sessão de design

Este documento não é a especificação funcional (isso é o `spec.md`) nem o plano técnico (isso será
o `plan.md`). É a ponte entre os dois e a ferramenta de design: lista **quais telas** precisam ser
desenhadas, **o que cada uma precisa mostrar/permitir**, e **como** o resultado do design volta
para virar código Tamagui no app.

## 1. Como este documento deve ser usado

1. A skill `design` (Claude Design) é usada para desenhar as telas listado na Seção 3, como um
   canvas com múltiplos artboards — uma sessão de design pode cobrir um grupo de telas
   relacionadas (ex.: todas as telas de "Cartões e Faturas" em um canvas, "Estabelecimentos e
   Categorias" em outro).
2. O conteúdo de cada artboard deve ser guiado pela descrição funcional de cada tela abaixo
   (objetivo, dados principais, ações, estados) — não pelo `spec.md` diretamente, que é
   deliberadamente livre de detalhes de UI.
3. Você revisa/ajusta visualmente o canvas publicado (é editável por clique, com painel de
   propriedades, exatamente como qualquer Artifact de design).
4. Quando estiver satisfeito com uma tela ou grupo de telas, avise para eu ler o canvas publicado
   (`Artifact` → `read`) e traduzir o resultado em componentes Tamagui reais no app.

## 2. O que acontece na tradução (importante)

O canvas do Claude Design é HTML/CSS — útil como **referência visual fiel** (cores, espaçamento,
tipografia, composição, estados, hierarquia visual), mas não é código React Native e não será
copiado literalmente. Ao traduzir cada tela para o app, eu vou:

- Mapear a paleta de cores e escala de espaçamento/tipografia do design para os tokens de tema do
  Tamagui (`tamagui.config.ts`), não para estilos soltos por componente.
- Recompor cada layout usando primitivos do Tamagui (`YStack`, `XStack`, `Card`, `Sheet`,
  `Avatar`, `Button` etc.) equivalentes ao que o design mostra, adaptado às limitações reais de
  React Native (sem CSS Grid/hover, gestos touch em vez de mouse, etc.).
- Escolher um pacote de ícones compatível com Tamagui/React Native (ex.: `@tamagui/lucide-icons`)
  para reproduzir os ícones usados no design.
- Seguir a lógica funcional do `spec.md`/`plan.md` sempre que o mockup for ambíguo sobre
  comportamento (o design manda no visual; a spec manda no comportamento).

## 3. Restrições globais de design

- **Dispositivo alvo**: Android, celular, uso predominantemente em retrato (portrait); não há
  necessidade de layout para tablet ou paisagem nesta fase (constituição: Android-only).
- **Tema**: a definir durante o design — se o app deve seguir o tema claro/escuro do sistema
  operacional ou ter um tema fixo. Ponto em aberto (ver Seção 6).
- **Moeda**: sempre Real (R$), formatado no padrão brasileiro (ex.: "R$ 1.234,56").
- **Densidade de informação**: é um app de uso pessoal diário — prioriza clareza e rapidez de
  leitura de valores (fatura do mês, saldo) sobre estética minimalista vazia.
- **Offline por padrão**: nenhuma tela deve indicar "carregando do servidor" como estado normal;
  estados de carregamento existem apenas para operações locais (abrir banco, calcular fatura) ou
  para a busca opcional de logotipo de estabelecimento (que deve poder ser ignorada/falhar sem
  travar a tela — ver `spec.md`, FR-036).

### 3.1 Identidade visual e tom (definido pelo usuário)

- **Tom geral**: neutro e minimalista — clareza acima de tudo. O usuário deve entender de relance
  o que está acontecendo em qualquer tela (saldo, fatura, gasto do mês), sem poluição visual.
- **Inspiração**: linguagem de design de interfaces da Apple (iOS/macOS) — bastante espaço em
  branco, hierarquia tipográfica clara, cantos arredondados consistentes, poucos elementos
  decorativos, foco no conteúdo (números e nomes) em vez de ornamentos.
- **Tipografia**: fonte moderna e legível, no mesmo espírito da SF Pro (usada pela Apple). Como a
  SF Pro é proprietária da Apple e não está disponível via Google Fonts (única fonte de fontes
  externas permitida no ambiente de design), usar uma alternativa geométrica/humanista próxima em
  personalidade — ex.: **Inter** ou **Manrope** — como fonte de trabalho durante o design e a
  implementação.
- **Cor primária**: verde, em um tom **médio-escuro** — nunca um verde claro, pastel ou "menta".
  Pensar em algo próximo de um verde floresta/esmeralda escurecido, transmitindo solidez e
  confiança (comum em apps financeiros), mas sem parecer o verde neon padrão de dinheiro. O tom
  exato (hex) e a paleta complementar (tons de apoio, cor de alerta/erro, cor de sucesso, tons de
  cinza neutro para fundo/texto) devem ser fechados durante a sessão de Claude Design.
- **Navegação**: barra de menu inferior (bottom tab bar) para as seções principais do app (ex.:
  Início, Cartões, Assinaturas, Reservas, Mais), com abas internas (top tabs) dentro de cada
  funcionalidade quando fizer sentido (ex.: dentro de "Cartão — Detalhe", alternar entre "Faturas"
  e "Dados do cartão"). A estrutura exata de quais telas viram abas de nível superior vs. abas
  internas deve ser validada durante o Claude Design.

## 4. Sistema de identificação visual (avatar/ícone) — resumo funcional

Esse sistema aparece em várias telas (listagem de compras, faturas, assinaturas), então vale
descrevê-lo uma vez:

- Toda transação exibe um avatar circular/quadrado pequeno ao lado da descrição e do valor.
- Prioridade do avatar exibido: (1) logotipo do estabelecimento em cache, se houver; (2) ícone de
  respaldo do estabelecimento, se associado mas sem logotipo; (3) ícone da categoria, se não há
  estabelecimento; (4) ícone genérico "Outros", se não há nem estabelecimento nem categoria.
- Esse componente de avatar deve ser desenhado uma vez como padrão reutilizável, não redesenhado
  em cada tela.

## 5. Telas a desenhar

Cada tela lista: objetivo, dados/elementos principais, ações principais, estados a cobrir, e
componentes especiais envolvidos. A prioridade (P1/P2/P3) referencia a User Story correspondente
no `spec.md` — comece desenhando as telas P1.

### 5.1 Início / Resumo do mês (P1 — US2, US5 sugestão de cartão, US11 gráfico)
- **Objetivo**: dar uma visão geral do saldo do mês assim que o app abre.
- **Principais elementos**: saldo do mês (renda vigente + entradas avulsas − Pix do mês − faturas
  que vencem no mês), atalho para adicionar entrada avulsa, resumo rápido das faturas do mês por
  cartão, card de "sugestão de melhor cartão para comprar hoje", e um **gráfico compacto do
  consumo mensal recente** (ex.: últimos 6 meses) — tocável, levando à tela de Estatísticas
  (Seção 5.2).
- **Ações**: adicionar entrada avulsa; editar renda mensal; ir para detalhe de qualquer cartão;
  tocar no gráfico para abrir Estatísticas; registrar nova compra (ação de destaque, tipo botão
  flutuante).
- **Estados**: primeiro uso (nenhum cartão/renda cadastrados ainda — precisa de onboarding leve);
  uso normal com dados; gráfico vazio/sem dados suficientes ainda (menos de 2 meses de histórico).

### 5.2 Estatísticas / Detalhes de Consumo (P2 — US11)
- **Objetivo**: dar uma visão detalhada e comparativa do consumo do usuário em um período
  ajustável, para ajudar a controlar gastos de forma mais precisa.
- **Principais elementos**:
  - Seletor de período: Diário, Semanal, Mensal (padrão), Anual.
  - Valor total gasto no período selecionado, em destaque.
  - Comparação percentual com o período equivalente anterior (ex.: "30% menor que o mês
    passado"), com indicação visual de melhora/piora.
  - Indicador de consumo ideal vs. renda configurada (ex.: barra de progresso "85% da meta
    ideal"), exibido somente quando o usuário tiver configurado uma meta (% da renda).
  - Gráfico de gasto por categoria no período (ex.: barras ou pizza, com o ícone de cada
    categoria).
  - Lista dos maiores gastos individuais do período (com avatar/ícone de cada um).
  - Percentual do gasto do período comprometido com assinaturas fixas vs. gasto variável.
- **Ações**: alternar período; tocar em uma categoria para ver as transações daquele agrupamento
  (se fizer sentido no fluxo); ir para a tela de configuração de renda/meta a partir do indicador
  de consumo ideal.
- **Estados**: sem dado do período anterior para comparar (primeiro uso); sem renda configurada
  (oculta a seção de meta ideal, sem quebrar o resto da tela); período sem nenhum gasto registrado.

### 5.3 Cartões — Lista (P1 — US1)
- **Objetivo**: ver todos os cartões cadastrados e o valor da fatura atual de cada um.
- **Elementos**: nome do cartão, dia de fechamento/vencimento, valor da fatura aberta atual.
- **Ações**: adicionar novo cartão; abrir detalhe de um cartão; arquivar/cancelar um cartão.
- **Estados**: lista vazia (nenhum cartão ainda); cartão arquivado (visualmente diferenciado, sem
  sumir da lista enquanto tiver parcelas ativas — ver `spec.md` FR-025).

### 5.4 Cartão — Detalhe / Faturas (P1 — US1)
- **Objetivo**: ver o histórico de faturas de um cartão específico (passadas, atual, futuras já
  com parcelas alocadas).
- **Elementos**: linha do tempo de faturas por mês/ano, valor total de cada uma, status
  (aberta/fechada/paga).
- **Ações**: abrir o detalhe de uma fatura específica; editar dados do cartão; importar CSV para
  este cartão.

### 5.5 Fatura — Detalhe (P1 — US1, US4)
- **Objetivo**: ver todas as compras/parcelas que compõem o valor de uma fatura mensal específica.
- **Elementos**: lista de compras/parcelas daquele mês, cada uma com avatar, nome (do
  estabelecimento reconhecido ou descrição bruta), valor da parcela, indicador de parcelamento
  (ex.: "3/12"), tags.
- **Ações**: abrir uma compra para editar (tags, comentário, estabelecimento); marcar fatura como
  paga.

### 5.6 Nova Compra / Editar Compra (P1 — US2, US4, US9, US10)
- **Objetivo**: formulário único para registrar ou editar uma compra, cobrindo Pix e Cartão.
- **Elementos**: descrição, valor, data, forma de pagamento (Pix/Cartão), campos de parcelamento
  quando Cartão for selecionado — quantidade total de parcelas **e** campo opcional "parcela
  atual" (para compras cujo parcelamento já está em andamento, ver `spec.md` US4/FR-004), seletor
  de categoria (opcional), seletor/criação rápida de estabelecimento (opcional, com sugestão
  automática se o texto bater com um padrão cadastrado), tags (múltiplas), comentário livre.
- **Ações**: salvar; criar nova tag inline; criar novo estabelecimento inline (a partir do texto
  já digitado); criar nova categoria inline.
- **Estados**: campo de parcelamento colapsado quando Pix é selecionado; aviso de validação
  quando "parcela atual" for maior que o total de parcelas (`spec.md` FR-005); indicação visual de
  que um estabelecimento foi reconhecido automaticamente antes de o usuário salvar.

### 5.7 Importar Fatura via CSV (P2 — US3)
- **Objetivo**: fluxo de upload de um arquivo CSV de um cartão.
- **Elementos**: seleção do cartão de destino; seleção do formato (genérico ou Nubank); resumo
  pós-importação (quantas transações importadas, quantas ignoradas e por quê — `spec.md` FR-026).
- **Ações**: selecionar arquivo; confirmar importação; revisar linhas ignoradas.

### 5.8 Assinaturas — Lista e Total (P2 — US6)
- **Objetivo**: ver todas as assinaturas ativas e o total mensal gasto com elas.
- **Elementos**: total somado em destaque no topo; lista de assinaturas com avatar/ícone, valor,
  forma de pagamento, dia de cobrança.
- **Ações**: adicionar nova assinatura; editar/cancelar uma assinatura existente.

### 5.9 Nova Assinatura / Editar Assinatura (P2 — US6)
- **Objetivo**: formulário para cadastrar uma cobrança recorrente.
- **Elementos**: nome, valor, forma de pagamento (Pix/Cartão + qual cartão), dia do mês de
  cobrança, categoria, estabelecimento, tags.
- **Ações**: salvar; cancelar assinatura (mantendo histórico já gerado).

### 5.10 Reservas (Dinheiro Guardado) — Lista (P3 — US7)
- **Objetivo**: ver todas as reservas e seus saldos acumulados.
- **Elementos**: nome da reserva, saldo atual, taxa de rendimento mensal configurada (se houver).
- **Ações**: criar nova reserva; abrir detalhe de uma reserva.

### 5.11 Reserva — Detalhe / Extrato (P3 — US7)
- **Objetivo**: ver o histórico de movimentações de uma reserva e registrar novas.
- **Elementos**: saldo atual em destaque; extrato de lançamentos (depósito, retirada, rendimento
  manual, rendimento automático — este último ainda não implementado, ver `spec.md` FR-021);
  campo de taxa de rendimento mensal configurada.
- **Ações**: registrar depósito; registrar retirada; lançar rendimento manual; editar taxa de
  rendimento configurada.

### 5.12 Categorias — Gerenciar (P2 — US9)
- **Objetivo**: ver e gerenciar categorias de transação.
- **Elementos**: lista de categorias pré-definidas (não removíveis) e personalizadas (removíveis),
  cada uma com ícone e nome.
- **Ações**: criar categoria personalizada (nome + escolha de ícone); excluir categoria
  personalizada (com aviso de que transações associadas passam a usar o ícone "Outros" —
  `spec.md` FR-037).

### 5.13 Estabelecimentos — Gerenciar (P3 — US10)
- **Objetivo**: ver e gerenciar estabelecimentos cadastrados e seus padrões de reconhecimento.
- **Elementos**: lista de estabelecimentos com avatar, nome, quantidade de padrões cadastrados;
  detalhe de um estabelecimento mostrando todos os padrões associados, domínio (se houver) e
  status do logotipo (obtido em cache / usando ícone de respaldo).
- **Ações**: criar estabelecimento (nome, ícone de respaldo obrigatório, domínio opcional, um ou
  mais padrões); adicionar/remover padrões de um estabelecimento existente; editar ícone de
  respaldo.
- **Estados**: sem conexão de internet (indicar sutilmente que o logotipo ainda não foi obtido,
  sem parecer um erro).

### 5.14 Renda & Entradas Avulsas (P1 — US2)
- **Objetivo**: configurar a renda mensal vigente e ver/adicionar entradas avulsas do mês.
- **Elementos**: valor de renda mensal atual (com histórico de valores anteriores acessível);
  lista de entradas avulsas do mês corrente.
- **Ações**: atualizar valor da renda (efetivo a partir de agora, sem reescrever meses passados —
  `spec.md` FR-013); adicionar entrada avulsa (descrição + valor + data).

### 5.15 Backup — Exportar/Importar (P1 — US8)
- **Objetivo**: gerar e restaurar backups locais completos.
- **Elementos**: botão de exportar (com indicação de quando foi feito o último backup); botão de
  importar, com aviso claro de que a importação substitui todos os dados atuais (`spec.md`
  FR-024).
- **Estados**: confirmação antes de restaurar (ação destrutiva para os dados atuais do
  dispositivo).

## 6. Pontos em aberto para confirmar durante o design

- Suporte a tema escuro (dark mode) além do claro — ainda não decidido na especificação funcional.
- Tom exato (hex) do verde principal e da paleta complementar (tons de apoio, alerta, sucesso,
  cinzas neutros) — direção já definida (verde médio-escuro, nunca claro/pastel; ver Seção 3.1),
  falta fechar os valores exatos.
- Quais telas/seções viram abas de nível superior na barra inferior vs. abas internas dentro de
  uma funcionalidade — estrutura geral (barra inferior + abas internas) já confirmada pelo
  usuário (ver Seção 3.1), falta detalhar a árvore de navegação completa.
- Tipo de gráfico a usar no consumo mensal (linha, barras) e no detalhamento por categoria (barras
  horizontais, pizza/donut) — a definir com base no que ficar mais limpo/legível no Claude Design.
- Biblioteca/conjunto de ícones e emojis disponível para categorias e ícones de respaldo de
  estabelecimento — a lista final de opções pode ser refinada durante o design.
