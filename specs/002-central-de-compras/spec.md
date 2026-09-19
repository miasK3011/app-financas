# Feature Specification: Central de Compras e Navegação Simplificada

**Feature Branch**: `002-central-de-compras`

**Created**: 2026-09-19

**Status**: Draft

**Input**: User description: "Redesenhar a navegação principal do app e adicionar uma tela \"Compras\" central de todas as transações, substituindo a bottom tab bar atual de 5 abas (Início, Cartões, Assinaturas, Reservas, Mais) por 4 abas: Início, Cartões, Compras, Mais. Assinaturas e Reservas deixam de ser abas na navbar e passam a ser itens de entrada dentro da tela \"Mais\" [...]. A nova tela \"Compras\" mostra TODAS as transações do usuário, de todas as formas de pagamento, organizadas por mês, com navegador de mês, resumo por forma de pagamento, filtro rápido e lista agrupada por dia (ou por fatura em meses futuros com parcela prevista). Referência visual: canvas em https://claude.ai/artifact/FQp61TXP1JkG1arkAsET2K."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver todas as transações do mês, de qualquer forma de pagamento (Priority: P1)

Hoje o usuário só enxerga uma lista curta de "transações recentes" na tela Início. Uma compra feita
via Pix, por exemplo, aparece ali por pouco tempo e depois não existe mais nenhum lugar no app para
encontrá-la — o app parece um gerenciador de faturas de cartão, não um controle financeiro completo.
Com esta história, o usuário abre a tela "Compras" e vê, num só lugar, todas as compras do mês
corrente, não importa se foram pagas no cartão ou via Pix — incluindo o total gasto no mês e quanto
disso foi em cada forma de pagamento.

**Why this priority**: É o motivo da feature existir — resolve diretamente a queixa de que compras
fora do cartão "somem" do app. Sem esta história as demais não têm razão de ser.

**Independent Test**: Com compras já cadastradas no mês corrente em pelo menos duas formas de
pagamento diferentes, abrir a tela Compras a partir da navegação principal e confirmar que todas
aparecem, com o total e a divisão por forma de pagamento corretos — sem precisar visitar nenhuma
outra tela.

**Acceptance Scenarios**:

1. **Given** o usuário tem compras no cartão e via Pix cadastradas no mês corrente, **When** ele
   abre a tela Compras, **Then** vê as duas na mesma lista, cada uma identificada com um selo da sua
   forma de pagamento, mais o total do mês e a divisão por forma de pagamento.
2. **Given** o usuário está na tela Início olhando "Transações recentes", **When** ele toca em "Ver
   tudo", **Then** é levado à tela Compras já aberta no mês corrente.
3. **Given** uma compra parcelada no cartão, **When** ela aparece na lista de Compras, **Then** mostra
   o indicador da parcela atual sobre o total (ex.: "2/4").
4. **Given** o usuário toca em "Todos", "Cartão" ou "Pix" nos filtros rápidos, **When** um filtro é
   selecionado, **Then** a lista mostra apenas as transações daquela forma de pagamento, e o filtro
   "Todos" volta a mostrar todas.

---

### User Story 2 - Navegar entre meses para ver histórico e compras já previstas (Priority: P2)

O usuário quer olhar quanto gastou em meses anteriores, e também quer saber o que já está
"comprometido" em parcelas de meses futuros, sem precisar abrir cartão por cartão.

**Why this priority**: Estende o valor da História 1 no tempo — sem isso a tela Compras só serviria
para o mês corrente, uma limitação que o usuário explicitamente quer resolver (comparar com o
histórico e ver o que vem pela frente).

**Independent Test**: Com compras em pelo menos dois meses passados e uma compra parcelada com
parcelas futuras já lançadas, navegar para trás e para frente a partir do mês corrente e conferir
que cada mês mostra os dados certos, e que não é possível avançar além do último mês com parcela
lançada.

**Acceptance Scenarios**:

1. **Given** a tela Compras aberta no mês corrente, **When** o usuário toca na seta para voltar (ou
   arrasta o dedo da direita para a esquerda na área do navegador de mês), **Then** a tela passa a
   mostrar o mês anterior, com seus próprios totais e transações.
2. **Given** existe uma compra parcelada no cartão com parcelas já lançadas para os próximos 2 meses,
   **When** o usuário avança mês a mês a partir do corrente, **Then** consegue chegar até o segundo
   mês futuro (vendo um resumo "Previsto para [mês]" com as parcelas daquele mês agrupadas por
   fatura), e a seta de avançar fica desabilitada depois desse ponto.
3. **Given** não existe nenhuma parcela lançada para meses futuros, **When** o usuário está no mês
   corrente, **Then** a seta de avançar já aparece desabilitada.
4. **Given** o usuário está no mês mais antigo com dado cadastrado, **When** ele olha a seta de
   voltar, **Then** ela aparece desabilitada.

---

### User Story 3 - Navegação principal mais enxuta (Priority: P3)

Assinaturas e Reservas são usadas com pouca frequência perto de Início, Cartões e (agora) Compras.
Elas saem da barra de navegação inferior e passam a ficar dentro de "Mais", junto com Renda,
Categorias, Estabelecimentos e Backup.

**Why this priority**: É uma limpeza de navegação que pode ser entregue e teria valor mesmo sem as
Histórias 1 e 2 (embora só faça sentido *como parte* desta feature porque libera espaço na barra para
a nova aba Compras).

**Independent Test**: Abrir o app e contar as abas da navegação inferior (devem ser 4); abrir "Mais" e
confirmar que Assinaturas e Reservas aparecem lá como itens de lista, dentro da seção
"Planejamento", ao lado de Renda & Entradas.

**Acceptance Scenarios**:

1. **Given** o app aberto, **When** o usuário olha a barra de navegação inferior, **Then** vê
   exatamente 4 abas: Início, Cartões, Compras, Mais.
2. **Given** o usuário quer acessar Assinaturas ou Reservas, **When** ele toca em "Mais", **Then**
   encontra as duas como itens de lista dentro da seção "Planejamento", junto com "Renda &
   Entradas", e consegue abrir cada uma normalmente.
3. **Given** o usuário já tinha um atalho ou link direto para a tela de Assinaturas ou Reservas em
   qualquer outro lugar do app, **When** essa feature é implementada, **Then** esse atalho continua
   funcionando (a tela em si não muda de comportamento, só sai da barra inferior).

---

### Edge Cases

- O que acontece se o mês corrente (ou um mês passado) não tiver nenhuma transação cadastrada? A tela
  deve mostrar um estado vazio claro (sem quebrar o resumo por forma de pagamento, que fica zerado).
- O que acontece se, num mês futuro já visitável, uma parcela for editada/cancelada e deixar de haver
  qualquer parcela futura? O mês futuro deixa de estar disponível na próxima vez que a navegação for
  recalculada, e a seta de avançar reflete isso.
- O que acontece com uma cobrança automática de assinatura (gerada a partir de uma Assinatura ativa)?
  Ela aparece na tela Compras como qualquer outra transação daquele mês, sem tratamento especial.
- O que acontece se o usuário trocar de mês rapidamente várias vezes seguidas (seta ou swipe)? A tela
  sempre reflete o último mês selecionado, sem misturar dados de dois meses.
- O que acontece com uma compra cuja fatura do cartão ainda não fechou? Ela continua contando para o
  mês da data da compra, do mesmo jeito que já acontece hoje nas outras telas do app.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A navegação principal (barra inferior) DEVE ter exatamente 4 abas: Início, Cartões,
  Compras, Mais — nesta ordem.
- **FR-002**: As telas de Assinaturas e Reservas DEVEM deixar de ser abas da navegação principal e
  passar a ser acessíveis apenas a partir da tela "Mais", sem perda de nenhuma funcionalidade
  existente nelas.
- **FR-003**: A tela "Mais" DEVE organizar seus itens em seções: "Planejamento" (Renda & Entradas,
  Assinaturas, Reservas), "Organização" (Categorias, Estabelecimentos) e "Dados" (Backup).
- **FR-004**: O sistema DEVE fornecer uma nova tela "Compras", acessível pela navegação principal, que
  lista todas as transações do usuário (compras registradas, de qualquer forma de pagamento),
  organizadas por mês.
- **FR-005**: A tela Compras DEVE abrir, por padrão, no mês corrente.
- **FR-006**: A tela Compras DEVE exibir um navegador de mês no topo, com uma seta para voltar, o
  nome do mês e o ano centralizados, e uma seta para avançar.
- **FR-007**: O usuário DEVE conseguir trocar de mês tanto tocando nas setas quanto arrastando o dedo
  horizontalmente sobre a área do navegador de mês (gesto de swipe).
- **FR-008**: O sistema DEVE permitir navegar para qualquer mês passado em que exista pelo menos uma
  transação cadastrada.
- **FR-009**: O sistema DEVE permitir navegar para um mês futuro somente se existir pelo menos uma
  parcela de compra já lançada com vencimento previsto naquele mês; a seta de avançar DEVE ficar
  visualmente desabilitada a partir do mês seguinte ao último mês com esse tipo de dado.
- **FR-010**: Ao mostrar o mês corrente ou um mês passado, a tela Compras DEVE exibir: um resumo com
  o total gasto no mês e a divisão proporcional por forma de pagamento (com valores), chips de filtro
  rápido por forma de pagamento, e a lista de transações do mês agrupada por dia (ex.: "Hoje",
  "Ontem", "17 de setembro").
- **FR-011**: Cada linha de transação na lista DEVE mostrar: ícone da categoria, nome do
  estabelecimento, categoria, forma de pagamento (incluindo o nome do cartão quando for compra no
  cartão), o valor, um selo indicando a forma de pagamento, e — quando a compra for parcelada — o
  indicador da parcela atual sobre o total (ex.: "2/4").
- **FR-012**: Ao selecionar um filtro de forma de pagamento (Todos, Cartão, Pix), a lista de
  transações DEVE mostrar apenas as correspondentes; "Todos" DEVE voltar a mostrar todas.
- **FR-013**: Ao mostrar um mês futuro com parcelas previstas, a tela Compras DEVE exibir um resumo
  "Previsto para [mês]" com o total dessas parcelas, e a lista organizada por fatura de cartão (nome
  do cartão/banco e data de vencimento), em vez de agrupada por dia.
- **FR-014**: A visualização de mês futuro NÃO DEVE usar nenhum selo ou banner adicional de
  "previsto" além da seta de avançar desabilitada e do rótulo do próprio resumo — deve seguir o
  mesmo padrão visual do mês corrente.
- **FR-015**: A tela Compras DEVE oferecer um botão de ação flutuante para registrar uma nova compra,
  disponível quando o mês exibido é o corrente ou um mês passado.
- **FR-016**: Tocar numa transação da lista DEVE abrir a mesma tela de detalhe/edição de compra já
  existente no app.
- **FR-017**: A tela Início DEVE exibir um link "Ver tudo" ao lado do título "Transações recentes",
  que leva o usuário para a tela Compras já aberta no mês corrente.
- **FR-018**: Listas de transação (na tela Compras e em qualquer tela afetada por esta feature) NÃO
  DEVEM usar um contêiner com borda/fundo próprio ("card") — DEVEM usar lista simples com divisórias
  finas entre as linhas, seguindo o padrão já usado nas telas de Cartões, Início e Reservas. Blocos de
  card continuam reservados para resumos com um número em destaque.
- **FR-019**: Toda a tela Compras DEVE reutilizar as cores, tipografia e componentes visuais já
  estabelecidos no restante do app, sem introduzir um estilo visual novo.
- **FR-020**: A tela Compras e seus filtros DEVEM cobrir exatamente as formas de pagamento hoje
  suportadas pelo cadastro de compra: Cartão e Pix. "Dinheiro" como forma de pagamento fica fora do
  escopo desta feature (ver Assumptions) — nenhuma migração de schema ou mudança no formulário de
  Nova Compra/Editar Compra é necessária para o filtro ou o resumo por forma de pagamento.

### Key Entities

- **Compra** (já existe): cada linha da tela Compras representa uma Compra existente. Esta feature
  não muda como uma Compra é criada, apenas como o conjunto de Compras de um mês é apresentado e
  agrupado (por dia, no mês corrente/passado; por fatura, em mês futuro previsto).
- **Fatura** (já existe): usada como critério de agrupamento na visão de mês futuro previsto (uma
  seção por fatura de cartão que tenha parcela prevista naquele mês).
- **Mês exibido**: não é uma entidade persistida — é o estado de navegação da tela Compras (ano +
  mês), derivado a partir da data corrente do dispositivo e dos meses em que existe Compra (passado)
  ou Parcela já lançada (futuro).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A partir de qualquer tela do app, o usuário chega à lista completa de transações do
  mês corrente (qualquer forma de pagamento) em no máximo 2 toques.
- **SC-002**: 100% das compras cadastradas num mês, independentemente da forma de pagamento,
  aparecem na tela Compras daquele mês — nenhuma transação fica visível apenas temporariamente ou
  some do app depois de um tempo.
- **SC-003**: O usuário consegue ver quanto gastou em cada forma de pagamento num mês, sem sair da
  tela Compras nem fazer nenhum cálculo manual.
- **SC-004**: Trocar de mês (seta ou swipe) atualiza o conteúdo da tela imediatamente, sem
  necessidade de recarregar a tela ou navegar para fora dela.
- **SC-005**: O número de abas na navegação principal cai de 5 para 4, e nenhuma função hoje
  acessível pela barra inferior deixa de ser alcançável em até 2 toques a partir dela.

## Assumptions

- A tela de detalhe/edição de uma Compra já existente no app é reaproveitada ao tocar num item da
  lista da tela Compras (nenhuma tela nova de detalhe é criada por esta feature).
- Não há limite artificial de quantos meses passados podem ser navegados — o limite é simplesmente
  até onde existir Compra cadastrada.
- Uma cobrança gerada automaticamente por uma Assinatura ativa (`origem = ASSINATURA`) é tratada
  como qualquer outra Compra na tela Compras, sem badge ou agrupamento especial além dos já
  definidos por forma de pagamento.
- Dentro de um mesmo dia, a ordem das transações segue da mais recente para a mais antiga (mesmo
  critério cronológico já usado nas listas existentes do app).
- A reorganização da navegação (FR-001 a FR-003) não altera nenhum comportamento interno das telas
  de Assinaturas, Reservas, Renda, Categorias, Estabelecimentos ou Backup — apenas onde elas são
  alcançadas a partir da navegação principal.
- "Dinheiro" como forma de pagamento (mockup inicial incluía essa opção) fica fora do escopo desta
  feature — decisão explícita do usuário, para não acoplar a entrega da tela Compras a uma migração
  de schema. Fica registrado como candidato a uma feature futura.
