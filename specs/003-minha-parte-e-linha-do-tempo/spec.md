# Feature Specification: "Minha parte" × Global, linha do tempo de Compras, Faturas organizadas e gráfico de gastos

**Feature Branch**: `003-minha-parte-e-linha-do-tempo`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "Feature 003 — o app permite informar quando uma compra foi dividida (sua parte), mas a interface usa isso de forma inconsistente. US1: saldo do mês da Início pela parte do usuário + filtro Meu/Global em Estatísticas. US2: Compras como linha do tempo real (agrupada pelo dia da compra, mês = compras feitas no mês), filtro 'Só minhas', card de gasto com 'sua parte' como subtítulo. US3: lista de faturas do cartão oculta as pagas por padrão (botão para mostrá-las) e navega por ano com < >; detalhe da fatura agrupado por data, da mais recente à mais antiga. US4: seção de gastos em Estatísticas com visualização selecionável (lista ou gráfico de rosca por categoria) e toque no gráfico abrindo um detalhamento. Referências visuais: design/inicio-estatisticas/Estatisticas.dc.html, design/cartoes-e-compra/CartaoDetalhe.dc.html, design/cartoes-e-compra/FaturaDetalhe.dc.html."

## Clarifications

### Session 2026-10-12

- Q: Como aparece uma compra parcelada na linha do tempo de Compras? → A: Uma única vez, no dia da compra, com o valor total da compra e um selo com o número de parcelas (ex.: "4x"); o card de gasto do mês soma o valor total.
- Q: Quais compras o filtro "Só minhas" oculta? → A: Qualquer compra em que a parte do usuário é menor que o total — por divisão manual informada na compra ou por reembolso vinculado.
- Q: Quantas categorias o gráfico mostra antes de agrupar em "Outras"? → A: As 5 maiores + "Outras" (até 6 segmentos); a tela de detalhamento lista todas as categorias individualmente.
- Q: A seção de gastos oferece outros recortes além de categoria? → A: Não nesta feature — apenas gasto por categoria, com seletor Lista/Gráfico; recortes por forma de pagamento ou estabelecimento ficam fora de escopo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Saldo do mês pela minha parte e visão Meu/Global em Estatísticas (Priority: P1)

O usuário divide algumas compras com outras pessoas (ex.: um jantar de R$ 100 em que a parte dele é
R$ 40). Hoje a tela Início calcula o "Saldo do mês" descontando o valor total das compras e faturas,
como se tudo tivesse sido gasto por ele — então o saldo parece menor do que realmente é, e ele não
consegue saber quanto de fato gastou. Ao mesmo tempo, a tela de Estatísticas faz o contrário: mostra
só a parte dele, sem nenhuma forma de ver o total movimentado. Com esta história, a Início passa a
refletir o gasto real do usuário (a parte dele), e Estatísticas — a tela "detalhada" — ganha um
filtro para alternar entre "Meu gasto" e "Global".

**Why this priority**: É a queixa central: o número mais visível do app (saldo do mês) está
calculado sobre a base errada para o que o usuário quer acompanhar.

**Independent Test**: Com renda configurada e uma compra dividida de R$ 100 (parte do usuário
R$ 40) no mês, abrir a Início e confirmar que o saldo desconta R$ 40; abrir Estatísticas, alternar
para "Global" e ver R$ 100, voltar para "Meu gasto" e ver R$ 40.

**Acceptance Scenarios**:

1. **Given** renda de R$ 5.000 e, no mês, uma compra Pix de R$ 100 com parte do usuário de R$ 40,
   **When** o usuário abre a Início, **Then** o saldo do mês é R$ 4.960 e os "Gastos" do subtítulo
   mostram R$ 40.
2. **Given** uma fatura vencendo no mês com total de R$ 1.000, dos quais R$ 700 são da parte do
   usuário, **When** ele abre a Início, **Then** o saldo desconta R$ 700 (não R$ 1.000).
3. **Given** compras sem nenhuma divisão, **When** o usuário abre a Início, **Then** o saldo é
   idêntico ao calculado antes desta feature.
4. **Given** o usuário está em Estatísticas, **When** escolhe "Global", **Then** o total do
   período, o gasto por categoria, os maiores gastos e a participação de assinaturas passam a usar o
   valor total das compras.
5. **Given** "Global" selecionado e há compras divididas no período, **When** o usuário olha o
   card de total, **Then** vê também, em tamanho menor, quanto daquele total é a parte dele.
6. **Given** o usuário alterna o filtro, **When** troca o período (diário/semanal/mensal/anual),
   **Then** o filtro escolhido é mantido.

---

### User Story 2 - Compras como linha do tempo real do mês (Priority: P1)

Na tela Compras, o usuário quer acompanhar a linha do tempo do que comprou no mês. Hoje, compras no
cartão aparecem agrupadas no dia de vencimento da fatura, não no dia em que foram feitas — todas as
compras de um cartão se amontoam num único dia. Com esta história, cada compra aparece no dia em que
foi realizada, do dia mais recente para o mais antigo; o usuário pode filtrar para ver só as compras
que fez sozinho (sem divisão), e o card de gasto mostra também quanto ele gastou de fato.

**Why this priority**: A tela Compras perde o propósito de "linha do tempo" com o agrupamento atual;
e o card de gasto contradiz a visão de "minha parte" da US1.

**Independent Test**: Cadastrar uma compra no cartão em 25/09 (fatura vencendo em 10/10) e uma Pix
em 26/09, abrir Compras em setembro e conferir que aparecem sob "26 de setembro" e "25 de setembro",
nessa ordem; ativar "Só minhas" com uma das compras dividida e conferir que ela some.

**Acceptance Scenarios**:

1. **Given** uma compra no cartão feita em 25/09 cuja fatura vence em outubro, **When** o usuário
   abre Compras em setembro, **Then** a compra aparece no grupo "25 de setembro".
2. **Given** a mesma compra, **When** o usuário abre Compras em outubro, **Then** ela não aparece
   na lista de compras de outubro (outubro mostra apenas compras feitas em outubro).
3. **Given** compras em vários dias do mês, **When** a lista é exibida, **Then** os grupos de dia
   estão do mais recente para o mais antigo, e dentro de cada dia as compras também.
4. **Given** compras com e sem divisão de valor, **When** o usuário ativa o filtro "Só minhas",
   **Then** apenas compras sem nenhuma divisão aparecem, e o filtro combina com os filtros de forma
   de pagamento (Todos/Cartão/Pix).
5. **Given** o mês tem compras divididas, **When** o usuário olha o card de gasto, **Then** vê o
   total em destaque e, como subtítulo menor, "Sua parte: R$ X".
6. **Given** um filtro está ativo, **When** o usuário olha o card de gasto, **Then** os valores
   refletem apenas as compras visíveis na lista.
7. **Given** um mês futuro com parcelas previstas, **When** o usuário navega até ele, **Then** a
   visão de previsão por fatura continua funcionando como antes.

---

### User Story 3 - Faturas do cartão organizadas por ano e sem as pagas (Priority: P2)

Na tela de um cartão, a lista de faturas mistura faturas pagas, abertas e futuras de todos os anos;
com o passar do tempo isso vira poluição visual. Com esta história, a lista mostra um ano por vez,
navegável com botões "<" e ">", e esconde as faturas já pagas por padrão — um botão permite exibi-las
quando o usuário quiser consultá-las. No detalhe de uma fatura, as compras passam a ser agrupadas por
data, como na tela Compras, da mais recente para a mais antiga.

**Why this priority**: Melhora de organização; não altera nenhum valor exibido, mas fica pior a cada
mês de uso.

**Independent Test**: Num cartão com faturas pagas e abertas em dois anos diferentes, abrir o
cartão, confirmar que só aparecem as não pagas do ano corrente, navegar para o ano anterior com "<",
tocar em "Mostrar pagas" e ver as pagas; abrir uma fatura e conferir o agrupamento por data.

**Acceptance Scenarios**:

1. **Given** um cartão com faturas pagas e abertas no ano corrente, **When** o usuário abre o
   cartão, **Then** vê apenas as faturas não pagas daquele ano.
2. **Given** a lista exibida, **When** o usuário toca em "Mostrar pagas", **Then** as faturas pagas
   do ano aparecem junto às demais, e o botão passa a oferecer "Ocultar pagas".
3. **Given** o cartão tem faturas em 2025 e 2026, **When** o usuário toca em "<", **Then** a lista
   passa a mostrar as faturas de 2025; o botão "<" fica desabilitado no ano mais antigo com faturas
   e o ">" no ano mais recente.
4. **Given** um ano em que todas as faturas estão pagas e as pagas estão ocultas, **When** a lista é
   exibida, **Then** o usuário vê uma mensagem de estado vazio indicando que há faturas pagas
   ocultas.
5. **Given** uma fatura com compras em vários dias, **When** o usuário abre o detalhe da fatura,
   **Then** as compras aparecem agrupadas por data da compra, do dia mais recente para o mais antigo,
   no mesmo estilo de cabeçalho de dia da tela Compras.

---

### User Story 4 - Gastos por categoria em gráfico de rosca, com detalhamento (Priority: P3)

Em Estatísticas, o gasto por categoria é só uma lista, o que dificulta perceber de relance onde o
usuário gasta mais. Com esta história, a seção de gastos permite escolher a visualização — lista ou
gráfico circular (rosca), em que cada segmento é a porcentagem de uma categoria. Tocar no gráfico abre
uma tela de detalhamento com o gráfico ampliado e a lista com valores e porcentagens.

**Why this priority**: Ganho de leitura, não de correção; depende do filtro Meu/Global da US1 para
ficar coerente.

**Independent Test**: Com gastos em pelo menos 3 categorias no período, escolher "Gráfico" na seção
de gastos, ver a rosca com segmentos proporcionais, tocar nela e conferir a tela de detalhamento com
porcentagens que somam 100%.

**Acceptance Scenarios**:

1. **Given** gastos em várias categorias no período, **When** o usuário escolhe a visualização
   "Gráfico", **Then** vê um gráfico de rosca com um segmento por categoria, proporcional ao valor, e
   o total no centro.
2. **Given** o gráfico exibido, **When** o usuário toca nele, **Then** abre uma tela de
   detalhamento com o gráfico e a lista de categorias com valor e porcentagem.
3. **Given** "Global" selecionado (US1), **When** o usuário vê o gráfico ou o detalhamento,
   **Then** os valores usam o total das compras; com "Meu gasto", usam a parte do usuário.
4. **Given** gastos em mais de 5 categorias, **When** o gráfico é exibido, **Then** as 5 maiores
   têm segmento próprio e as demais são agrupadas em um segmento "Outras".
5. **Given** o usuário escolheu "Gráfico", **When** volta à tela de Estatísticas depois, **Then** a
   última visualização escolhida é mantida durante a sessão.

---

### Edge Cases

- Compra dividida em que a parte do usuário é R$ 0 (pagou pelo outro): conta R$ 0 em "Meu gasto",
  aparece na lista de Compras e é ocultada por "Só minhas".
- Compra com reembolso vinculado (entrada avulsa ligada à compra) reduz a parte do usuário; conta
  como compra dividida para "Só minhas". Ex.: compra de R$ 100 com reembolso vinculado de R$ 60 →
  o saldo desconta R$ 40 e a entrada de R$ 60 não é somada de novo (FR-001a).
- Mês sem nenhuma compra dividida: subtítulos "Sua parte" não aparecem (valor igual ao total).
- Período em Estatísticas sem gastos: o gráfico mostra estado vazio em vez de uma rosca vazia.
- Uma única categoria no período: rosca completa (100%) em um só segmento.
- Cartão sem nenhuma fatura: lista vazia sem navegação de ano.
- Fatura futura (prevista) pertence ao ano do seu vencimento na navegação por ano.
- Compra parcelada feita no mês: aparece uma vez na linha do tempo do mês da compra, com valor total e selo "Nx" (FR-006a).

## Requirements *(mandatory)*

### Functional Requirements

**Base de cálculo (minha parte × global)**

- **FR-001**: O "Saldo do mês" da Início DEVE descontar, para compras Pix e faturas do mês, somente
  a parte do usuário (valor de responsabilidade efetivo, já considerando divisão manual e reembolsos
  vinculados).
- **FR-001a**: Entradas avulsas vinculadas a uma compra (reembolsos) NÃO DEVEM somar ao saldo do
  mês, pois já estão refletidas na redução da parte do usuário naquela compra — evita contar o
  reembolso duas vezes. Elas continuam visíveis na lista de entradas.
- **FR-002**: O valor "Gastos" exibido junto ao saldo na Início DEVE usar a mesma base do FR-001.
- **FR-003**: A tela de Estatísticas DEVE oferecer um filtro com as opções "Meu gasto" (padrão) e
  "Global" (gasto global), aplicado a todas as seções de valores da tela (total do período, comparação com o
  período anterior, gasto por categoria, maiores gastos, participação de assinaturas).
- **FR-004**: Com "Global" e havendo diferença entre total e parte do usuário, o card de total
  DEVE exibir a parte do usuário como valor secundário menor.
- **FR-005**: A comparação com a meta de consumo ideal DEVE continuar usando a parte do usuário,
  independentemente do filtro.

**Compras (linha do tempo)**

- **FR-006**: A tela Compras, para o mês corrente e meses passados, DEVE listar as compras realizadas
  naquele mês (pela data da compra), de qualquer forma de pagamento.
- **FR-006a**: Uma compra parcelada DEVE aparecer uma única vez, no dia da compra, com o valor total
  da compra e um selo com o número de parcelas (ex.: "4x"); o card de gasto soma o valor total.
- **FR-007**: As compras DEVEM ser agrupadas pelo dia da compra, com grupos e itens ordenados do mais
  recente para o mais antigo.
- **FR-008**: A tela Compras DEVE oferecer o filtro "Só minhas", que oculta qualquer compra em que a
  parte do usuário é menor que o total (divisão manual ou reembolso vinculado), combinável com os
  filtros de forma de pagamento.
- **FR-009**: O card de gasto da tela Compras DEVE exibir o total em destaque e, quando houver
  diferença, a parte do usuário como subtítulo menor; ambos refletindo os filtros ativos.
- **FR-010**: A visão de previsão de meses futuros (parcelas agrupadas por fatura) DEVE permanecer
  inalterada.

**Faturas do cartão**

- **FR-011**: A lista de faturas de um cartão DEVE exibir um ano por vez, com controles "<" e ">"
  para ir ao ano anterior/seguinte, desabilitados fora do intervalo de anos com faturas; o ano
  inicial é o ano corrente (ou o mais próximo com faturas).
- **FR-012**: A lista DEVE ocultar faturas pagas por padrão e oferecer um controle para mostrá-las
  e ocultá-las novamente, indicando quantas pagas há no ano.
- **FR-013**: O detalhe de uma fatura DEVE agrupar as compras pela data da compra, do dia mais
  recente para o mais antigo, com os mesmos rótulos de dia da tela Compras.

**Visualização de gastos**

- **FR-014**: A seção de gasto por categoria em Estatísticas DEVE permitir escolher entre as
  visualizações "Lista" e "Gráfico".
- **FR-015**: A visualização "Gráfico" DEVE ser um gráfico de rosca com um segmento por categoria,
  proporcional à participação no gasto do período, exibindo as 5 maiores categorias e agrupando as
  demais em "Outras" (até 6 segmentos); o detalhamento (FR-016) lista todas individualmente.
- **FR-016**: Tocar no gráfico DEVE abrir uma tela de detalhamento com o gráfico e a lista de
  categorias com valor e porcentagem, respeitando o período e o filtro Meu/Global ativos.
- **FR-017**: As listas novas ou alteradas DEVEM seguir o padrão visual do app: linhas planas com
  divisórias; cards apenas para números-resumo.

### Key Entities

- **Compra**: registro de um gasto, com data da compra, valor total, forma de pagamento, categoria e,
  opcionalmente, divisão (parte do usuário menor que o total, por divisão manual ou reembolso
  vinculado). Nenhum atributo novo é necessário.
- **Parcela**: fração de uma compra alocada a uma fatura (cartão) ou ao mês (Pix), com valor total e
  parte do usuário.
- **Fatura**: agrega parcelas de um cartão; tem vencimento, status (aberta, fechada, paga, futura),
  total e total da parte do usuário.
- **Participação por categoria** (derivada): categoria, valor no período, porcentagem do total.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Para qualquer mês com compras divididas, o saldo exibido na Início difere do anterior
  exatamente pela soma das partes de terceiros, e coincide com o "Meu gasto" mensal de Estatísticas
  para o mesmo conjunto de compras do mês.
- **SC-002**: Em Estatísticas, o usuário alterna entre "Meu gasto" e "Global" com um único
  toque, e todas as seções mudam juntas.
- **SC-003**: 100% das compras exibidas na tela Compras aparecem sob o dia em que foram realizadas.
- **SC-004**: Com 2+ anos de uso, a lista de faturas de um cartão exibe por padrão no máximo as
  faturas não pagas de um ano (até ~12 linhas mais as futuras daquele ano).
- **SC-005**: O usuário identifica a categoria de maior gasto do período em até 5 segundos olhando
  o gráfico, e as porcentagens do detalhamento somam 100% (±0,1 por arredondamento).

## Assumptions

- **Compra parcelada na linha do tempo** (confirmado, ver Clarifications): as parcelas seguintes
  continuam visíveis na previsão dos meses futuros e nas faturas.
- **Cores do gráfico**: fixas por posição no ranking (categorias não têm cor própria).
- O saldo continua sendo calculado sobre as faturas que vencem no mês e as compras Pix do mês; só
  muda a base do valor (parte do usuário em vez de total).
- O total exibido nos cards de "Faturas do mês" da Início e no detalhe da fatura continua sendo o
  valor total da fatura (é o que será pago ao banco); só o saldo muda.
- O histórico "Consumo mensal" da Início já usa a parte do usuário e permanece como está.
- A escolha de visualização (Lista/Gráfico) e do filtro Meu/Global é lembrada enquanto o app estiver
  aberto, inclusive ao sair e voltar para Estatísticas; não é necessário persistir entre aberturas
  do app.
- **Fora de escopo**: recortes de gasto além de categoria (forma de pagamento, cartão,
  estabelecimento) e persistência das preferências de visualização entre aberturas do app.
- Não há mudança no armazenamento de dados nem migração; tudo é derivado de dados existentes.
