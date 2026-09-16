# Feature Specification: Controle Financeiro Pessoal — Núcleo (Cartões, Fluxo de Caixa, Assinaturas e Reservas)

**Feature Branch**: `001-personal-finance-tracker`

**Created**: 2026-09-15

**Status**: Draft

**Input**: User description: "App para controlar finanças pessoais (uso individual, offline, sem login), cobrindo cartões de crédito com fatura/fechamento/vencimento/parcelamento e sugestão de melhor cartão para compra, contas/fluxo de caixa (Pix, salário, entradas avulsas), assinaturas recorrentes herdando propriedades de uma compra, e reservas de dinheiro guardado com rendimento (manual e taxa configurável; execução automática é feature futura)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar cartões e ver o valor certo da fatura (Priority: P1)

Como usuário, quero cadastrar meus cartões de crédito informando o dia de fechamento e o dia
de vencimento de cada um, para que o app calcule corretamente quanto devo pagar em cada fatura
mensal, considerando quais compras (e parcelas de compras) caem em cada ciclo.

**Why this priority**: Sem o cálculo correto de fatura por cartão, nenhuma outra funcionalidade
de cartão (parcelamento, sugestão de melhor cartão) tem base confiável. É o alicerce do controle
de cartões.

**Independent Test**: Pode ser testado cadastrando um cartão com fechamento e vencimento
definidos, registrando algumas compras em datas diferentes, e verificando que cada compra aparece
na fatura mensal correta com o valor certo.

**Acceptance Scenarios**:

1. **Given** um cartão com fechamento no dia 10 e vencimento no dia 17, **When** o usuário registra
   uma compra à vista no dia 5, **Then** o valor aparece na fatura que fecha no dia 10 daquele mês.
2. **Given** o mesmo cartão, **When** o usuário registra uma compra no dia 10 (data exata do
   fechamento), **Then** o valor entra na fatura que fecha nesse mesmo dia 10 (não na próxima).
3. **Given** o mesmo cartão, **When** o usuário registra uma compra no dia 11 (um dia após o
   fechamento), **Then** o valor só aparece na fatura do ciclo seguinte.

---

### User Story 2 - Acompanhar o saldo do mês (Pix, salário e entradas avulsas) (Priority: P1)

Como usuário, quero configurar minha renda mensal, registrar compras feitas via Pix e adicionar
entradas avulsas de dinheiro (ex.: um freela) a qualquer momento, para acompanhar quanto sobra ou
falta no meu saldo do mês corrente.

**Why this priority**: É o uso diário mais básico do app — saber quanto dinheiro está disponível
no mês, independentemente de cartões.

**Independent Test**: Pode ser testado configurando uma renda mensal, adicionando uma entrada
avulsa e uma compra via Pix, e conferindo se o saldo do mês reflete a soma/subtração correta.

**Acceptance Scenarios**:

1. **Given** uma renda mensal configurada, **When** o usuário atualiza o valor da renda,
   **Then** o saldo do mês corrente passa a refletir o novo valor imediatamente.
2. **Given** o saldo do mês atual, **When** o usuário adiciona uma entrada avulsa (ex.: R$ 20 de
   um freela), **Then** o saldo do mês aumenta exatamente nesse valor.
3. **Given** o saldo do mês atual, **When** o usuário registra uma compra via Pix, **Then** o
   saldo do mês é reduzido pelo valor da compra, refletido na data da compra.

---

### User Story 3 - Importar fatura via CSV com tags e comentários (Priority: P2)

Como usuário, quero importar o extrato/fatura de um cartão a partir de um arquivo CSV (no formato
genérico do app ou no formato de exportação do Nubank), e depois adicionar tags e comentários às
transações importadas, para não precisar digitar cada compra manualmente.

**Why this priority**: Reduz drasticamente o esforço de entrada de dados mensal, mas depende da
User Story 1 já estar funcionando (cálculo de fatura).

**Independent Test**: Pode ser testado importando um arquivo CSV de exemplo (genérico e Nubank) e
verificando que as transações aparecem corretamente distribuídas nas faturas, com a opção de
adicionar tags/comentários a cada uma.

**Acceptance Scenarios**:

1. **Given** um arquivo CSV no formato genérico do app, **When** o usuário faz o upload
   selecionando o cartão de destino, **Then** todas as transações (data, valor, descrição) são
   importadas e distribuídas nas faturas corretas.
2. **Given** um arquivo CSV exportado do Nubank, **When** o usuário faz o upload, **Then** o
   sistema reconhece o formato e importa as transações da mesma forma.
3. **Given** uma transação importada, **When** o usuário adiciona uma tag e um comentário a ela,
   **Then** essas informações ficam salvas e visíveis ao consultar a transação depois.

---

### User Story 4 - Comprar parcelado, inclusive parcelamentos já em andamento, e ver a divisão automática entre faturas (Priority: P1)

Como usuário, quero informar o valor total e o número de parcelas de uma compra no cartão, para
que o app calcule e distribua automaticamente cada parcela na fatura mensal correspondente, sem eu
precisar fazer essa conta manualmente. Também quero poder cadastrar uma compra cujo parcelamento já
está em andamento antes de eu começar a usar o app — informando em qual parcela estou atualmente —
para que o sistema gere só as parcelas restantes, sem eu precisar recriar o histórico das que já
paguei.

**Why this priority**: É um dos pedidos centrais do app — parcelamento incorreto quebra a
confiança no cálculo de fatura de meses futuros. Sem o suporte a parcelamentos já em andamento, o
usuário não conseguiria migrar para o app compras parceladas que já estava pagando antes de
adotá-lo.

**Independent Test**: Pode ser testado registrando uma compra de valor conhecido em N parcelas e
conferindo se cada uma das N faturas seguintes recebe a fração correta do valor, todas com as
mesmas tags/comentários da compra original; e também registrando uma compra parcelada informando
uma parcela atual maior que 1, conferindo que só as parcelas restantes são geradas.

**Acceptance Scenarios**:

1. **Given** uma compra de R$ 300 em 3 parcelas no dia 5 (cartão com fechamento dia 10), **When**
   o usuário salva a compra, **Then** o sistema cria 3 parcelas de R$ 100, uma na fatura do mês
   corrente e uma em cada uma das duas faturas seguintes.
2. **Given** essa mesma compra parcelada, **When** o usuário adiciona uma tag a ela, **Then** a
   tag aparece em todas as 3 parcelas, pois pertencem à mesma compra original.
3. **Given** uma compra de R$ 1.200 em 12 parcelas, feita originalmente há alguns meses, **When**
   o usuário a cadastra informando o valor total original, o total de 12 parcelas e que a parcela
   atual (a próxima a vencer) é a 5ª, **Then** o sistema calcula o valor de cada parcela (R$ 100),
   aloca a 5ª parcela na fatura correspondente e as parcelas 6 a 12 nas faturas seguintes, sem
   criar nenhum registro para as parcelas 1 a 4 (já pagas antes de o usuário adotar o app).
4. **Given** uma compra em 6 parcelas, **When** o usuário tenta informar que a parcela atual é a
   8ª, **Then** o sistema impede o cadastro e avisa que a parcela atual não pode ser maior que o
   total de parcelas.

---

### User Story 5 - Sugestão de melhor cartão para comprar hoje (Priority: P2)

Como usuário, quero que o app me diga qual cartão é mais vantajoso para eu usar em uma compra
feita hoje, com base no prazo total até o vencimento da fatura correspondente, para maximizar o
tempo que tenho até precisar pagar.

**Why this priority**: É um diferencial de planejamento financeiro, mas depende do cálculo de
fechamento/vencimento (User Story 1) já estar correto.

**Independent Test**: Pode ser testado cadastrando dois ou mais cartões com datas de
fechamento/vencimento diferentes e verificando se o app aponta corretamente qual deles dá o maior
prazo total até o pagamento, considerando a data de hoje.

**Acceptance Scenarios**:

1. **Given** dois cartões cadastrados com ciclos de fechamento/vencimento diferentes, **When** o
   usuário consulta "melhor cartão para comprar hoje", **Then** o app indica o cartão cuja fatura
   correspondente (considerando a data de hoje) vence mais tarde.

---

### User Story 6 - Assinaturas recorrentes e total mensal (Priority: P2)

Como usuário, quero cadastrar minhas assinaturas (Netflix, academia etc.) com valor, forma de
pagamento e dia de cobrança, para que elas sejam lançadas automaticamente todo mês e eu consiga
ver rapidamente quanto gasto no total com assinaturas.

**Why this priority**: Assinaturas são compras recorrentes previsíveis; automatizar seu
lançamento evita esquecimento e retrabalho mensal.

**Independent Test**: Pode ser testado cadastrando uma assinatura e avançando para o mês seguinte,
verificando que uma nova cobrança é gerada automaticamente na data configurada, e que a tela de
assinaturas mostra a soma correta de todas as ativas.

**Acceptance Scenarios**:

1. **Given** uma assinatura cadastrada com cobrança no cartão no dia 15, **When** chega o dia 15
   de um novo mês, **Then** uma nova compra referente a essa assinatura é lançada automaticamente
   na fatura correspondente.
2. **Given** uma assinatura paga via Pix, **When** ela é gerada no mês, **Then** o valor é
   descontado do saldo do mês corrente, não de uma fatura de cartão.
3. **Given** três assinaturas ativas, **When** o usuário abre a tela de assinaturas, **Then** vê a
   lista de todas elas e o valor total somado.

---

### User Story 7 - Reservas de dinheiro guardado com rendimento (Priority: P3)

Como usuário, quero manter uma ou mais reservas de dinheiro guardado, registrando depósitos,
retiradas e rendimentos (lançados manualmente ou por uma taxa mensal configurada), para acompanhar
quanto tenho guardado e como isso cresce ao longo do tempo.

**Why this priority**: É uma funcionalidade de acompanhamento patrimonial, valiosa mas menos
urgente que o controle do dia a dia de cartões e fluxo de caixa. A aplicação automática da taxa de
rendimento mês a mês é explicitamente uma evolução futura (ver Assumptions).

**Independent Test**: Pode ser testado criando uma reserva, registrando um depósito e um
lançamento manual de rendimento, e conferindo que o saldo acumulado da reserva reflete essas
movimentações corretamente.

**Acceptance Scenarios**:

1. **Given** uma reserva criada, **When** o usuário registra um depósito, **Then** o saldo da
   reserva aumenta pelo valor depositado.
2. **Given** uma reserva com uma taxa de rendimento mensal configurada, **When** o usuário
   consulta a reserva, **Then** vê a taxa configurada exibida, mesmo que sua aplicação automática
   ainda não ocorra nesta versão.
3. **Given** uma reserva, **When** o usuário lança manualmente um valor de rendimento recebido,
   **Then** esse valor é somado ao saldo da reserva e aparece no histórico de lançamentos.

---

### User Story 8 - Backup local dos dados (Priority: P1)

Como usuário, quero exportar todos os meus dados para um arquivo de backup e poder restaurá-lo
depois, para não perder minhas informações financeiras ao trocar de aparelho ou reinstalar o app
(já que não existe login nem sincronização em nuvem).

**Why this priority**: Sem login nem nuvem, o backup local é a única proteção contra perda total
de dados — é tão crítico quanto o próprio registro dos dados.

**Independent Test**: Pode ser testado exportando um backup com dados de exemplo, apagando os
dados do app (ou reinstalando), e restaurando o backup para conferir que tudo volta exatamente
como estava.

**Acceptance Scenarios**:

1. **Given** dados cadastrados no app (cartões, compras, assinaturas, reservas), **When** o
   usuário exporta um backup, **Then** um arquivo contendo todos esses dados é gerado.
2. **Given** um arquivo de backup previamente exportado, **When** o usuário importa esse arquivo
   em uma instalação com dados existentes, **Then** os dados atuais do dispositivo são
   substituídos integralmente pelo conteúdo do backup.

---

### User Story 9 - Categorizar transações com ícones (Priority: P2)

Como usuário, quero que cada transação possa ter uma categoria (ex.: Compras, Transporte,
Alimentação), escolhida entre categorias já prontas ou criadas por mim, para identificar
visualmente o tipo de gasto mesmo quando não sei ou não cadastrei o estabelecimento exato.

**Why this priority**: Fornece o ícone de identificação visual usado em toda listagem de
transações, servindo de base para o refinamento por estabelecimento (User Story 10).

**Independent Test**: Pode ser testado criando uma transação sem estabelecimento associado,
atribuindo uma categoria a ela e conferindo que o ícone da categoria aparece na listagem; e
criando uma categoria personalizada e usando-a da mesma forma.

**Acceptance Scenarios**:

1. **Given** um conjunto de categorias pré-definidas (ex.: Compras, Transporte, Alimentação),
   **When** o usuário registra uma nova compra, **Then** ele pode escolher uma dessas categorias
   para a transação.
2. **Given** que nenhuma categoria pré-definida atende sua necessidade, **When** o usuário cria
   uma categoria personalizada com nome e ícone próprios, **Then** essa categoria passa a estar
   disponível para uso em qualquer transação.
3. **Given** uma transação sem estabelecimento associado, **When** o usuário a categoriza como
   "Transporte", **Then** o ícone de "Transporte" é exibido ao lado dela na listagem.
4. **Given** uma transação sem estabelecimento e sem categoria definida, **When** exibida na
   listagem, **Then** o sistema mostra um ícone padrão genérico ("Outros").

---

### User Story 10 - Mapear estabelecimentos conhecidos com avatar (Priority: P3)

Como usuário, quero cadastrar estabelecimentos (com nome amigável, um ícone de respaldo e,
opcionalmente, o domínio do site) e um ou mais padrões de texto que costumam aparecer nas
faturas, para que o app substitua automaticamente aquele texto confuso da fatura (ex.:
"SHPEE*38220SP") pelo nome de exibição do estabelecimento (ex.: "Shopee"), com um avatar visual
reconhecível — inclusive buscando o logotipo oficial da marca quando houver internet disponível.

**Why this priority**: Melhora a legibilidade das faturas e transações importadas, mas depende do
sistema de categorias (User Story 9) já existir como respaldo visual e do fluxo de importação de
CSV (User Story 3) já funcionar.

**Independent Test**: Pode ser testado cadastrando um estabelecimento com um padrão (ex.:
"UBER"), registrando ou importando transações cuja descrição contenha esse padrão, e conferindo
que elas passam a exibir o nome e avatar do estabelecimento automaticamente — com e sem conexão
de internet disponível.

**Acceptance Scenarios**:

1. **Given** um estabelecimento cadastrado com nome "Shopee" e o padrão "SHPEE", **When** uma
   transação com descrição "SHPEE*38220SP" é registrada ou importada, **Then** ela é
   automaticamente associada ao estabelecimento "Shopee" e exibida com esse nome e avatar.
2. **Given** um estabelecimento "Uber" cadastrado com o padrão "UBER" (que já cobre tanto
   "Uber*pending" quanto "Uber*ride" por conter esse texto em comum), **When** transações com
   essas duas descrições são registradas, **Then** ambas são associadas ao mesmo estabelecimento
   "Uber".
3. **Given** uma transação já registrada que ainda não bateu com nenhum padrão, **When** o
   usuário abre a edição dessa transação e cria um novo estabelecimento diretamente por ali (com
   um padrão inicial sugerido a partir do texto da própria transação), **Then** o estabelecimento
   é criado e a transação atual passa a exibi-lo.
4. **Given** um estabelecimento com domínio informado (ex.: "shopee.com.br") e conexão com a
   internet disponível, **When** o sistema tenta obter automaticamente um logotipo oficial para
   esse domínio, **Then** o logotipo obtido é salvo localmente (em cache) e passa a ser usado como
   avatar daquele estabelecimento nas próximas exibições, inclusive offline.
5. **Given** o mesmo estabelecimento sem conexão de internet disponível (ou sem logotipo
   encontrado/em cache), **When** suas transações são exibidas, **Then** o ícone de respaldo
   escolhido manualmente pelo usuário é exibido no lugar do logotipo, sem qualquer travamento ou
   atraso perceptível na tela.
6. **Given** um estabelecimento existente, **When** o usuário adiciona um novo padrão a ele (ex.:
   adicionar "UBER EATS" ao estabelecimento "Uber"), **Then** todas as transações já registradas
   anteriormente cujo texto corresponda a esse novo padrão, e que ainda não tinham um
   estabelecimento atribuído manualmente, passam a ser associadas automaticamente a esse
   estabelecimento.

---

### User Story 11 - Painel de estatísticas e comparação de consumo (Priority: P2)

Como usuário, quero ver na tela inicial um gráfico simples do meu consumo mensal e, ao tocar
nele, abrir uma tela de estatísticas detalhada onde posso ajustar o período de análise (diário,
semanal, mensal ou anual), ver quanto gastei nesse período, comparar com o período equivalente
anterior, ver o quanto disso está comprometido com assinaturas fixas, quais foram meus maiores
gastos, quanto gastei por categoria, e se meu gasto está dentro do que considero ideal para a
renda que tenho configurada — para controlar meus gastos de forma mais precisa e visual.

**Why this priority**: Não é necessário para o cálculo correto de faturas ou saldo do mês (que já
são P1), mas é o principal recurso de acompanhamento e planejamento do app ao longo do tempo;
depende dos dados de compras, categorias e renda já existentes (User Stories 1, 2 e 9) para ter
conteúdo a exibir.

**Independent Test**: Pode ser testado registrando compras em pelo menos dois meses diferentes,
com categorias variadas e ao menos uma assinatura ativa, e verificando que o gráfico da tela
inicial reflete o total de cada mês, e que a tela de estatísticas mostra corretamente o total do
período selecionado, a comparação percentual com o período anterior, o detalhamento por
categoria, os maiores gastos, o percentual comprometido com assinaturas, e a posição do gasto em
relação à meta de consumo ideal configurada (quando houver).

**Acceptance Scenarios**:

1. **Given** compras registradas no mês corrente, **When** o usuário abre a tela inicial, **Then**
   vê um gráfico com o consumo mensal, refletindo o total gasto nos últimos meses.
2. **Given** esse gráfico na tela inicial, **When** o usuário toca nele, **Then** é levado à tela
   de estatísticas detalhada.
3. **Given** a tela de estatísticas aberta no período "Mensal" (padrão), **When** o usuário muda
   para "Semanal", "Diário" ou "Anual", **Then** todos os valores exibidos (total gasto,
   comparação, detalhamento por categoria, maiores gastos, % de assinaturas) são recalculados
   para o novo período.
4. **Given** o gasto do mês corrente e do mês anterior, **When** o usuário consulta a tela de
   estatísticas, **Then** vê a variação percentual entre os dois (ex.: "30% menor que o mês
   anterior").
5. **Given** uma meta de consumo ideal configurada como um percentual da renda mensal, **When** o
   gasto do período selecionado é maior ou menor que essa meta, **Then** o sistema indica
   claramente se o usuário está dentro ou fora do ideal (ex.: "você já usou 85% da meta ideal
   para este mês").
6. **Given** nenhuma meta de consumo ideal configurada, **When** o usuário abre a tela de
   estatísticas, **Then** vê o total gasto e a comparação com o período anterior, sem a seção de
   ideal/meta (que é opcional).
7. **Given** compras em múltiplas categorias no período selecionado, **When** o usuário consulta
   as estatísticas, **Then** vê o valor gasto em cada categoria dentro daquele período.
8. **Given** várias compras de valores distintos no período selecionado, **When** o usuário
   consulta as estatísticas, **Then** vê uma lista dos maiores gastos individuais daquele período.
9. **Given** assinaturas ativas e o total gasto no período, **When** o usuário consulta as
   estatísticas, **Then** vê qual percentual do gasto (ou da renda) está comprometido com
   assinaturas fixas, separando gasto fixo de gasto variável.

---

### User Story 12 - Dividir compras com outras pessoas (Priority: P2)

Como usuário, quero poder registrar que uma compra no cartão não é totalmente (ou nem um pouco)
de minha responsabilidade — porque dividi a conta com alguém ou porque a compra foi de outra
pessoa usando meu cartão — e ver claramente quanto é o total da fatura e quanto disso é
realmente meu gasto, para acompanhar meu consumo pessoal com precisão mesmo dividindo o cartão
com familiares.

**Why this priority**: Não é necessário para o cálculo correto da fatura em si (que já funciona
olhando o valor total de cada compra), mas é essencial para que as Estatísticas e o
acompanhamento de gasto pessoal reflitam a realidade de quem compartilha cartão com outras
pessoas; depende das compras e faturas (User Story 1, User Story 4) e das estatísticas (User
Story 11) já existirem.

**Independent Test**: Pode ser testado registrando uma compra de R$ 70, definindo manualmente que
a responsabilidade do usuário é R$ 30 com um motivo, e conferindo que a fatura continua mostrando
R$ 70 no total mas exibe R$ 30 como "sua responsabilidade", e que as Estatísticas contam R$ 30
como gasto no lugar de R$ 70. Também testado registrando uma compra inteiramente de terceiros
(responsabilidade R$ 0) e conferindo que ela deixa de contar como gasto pessoal nas Estatísticas
mas continua aparecendo na fatura. E testado vinculando uma entrada avulsa de reembolso a uma
compra e conferindo que a responsabilidade é recalculada automaticamente.

**Acceptance Scenarios**:

1. **Given** uma compra de R$ 70 (pizza) no cartão, **When** o usuário edita a compra e define
   manualmente que sua responsabilidade é R$ 30 com o motivo "Dividido com Maria", **Then** a
   fatura daquele mês continua somando os R$ 70 completos no total, mas a compra e a fatura
   passam a exibir também "sua responsabilidade: R$ 30".
2. **Given** uma compra de R$ 100 feita por outra pessoa usando o cartão do usuário, **When** o
   usuário define a responsabilidade dessa compra como R$ 0 (com um responsável opcional, ex.:
   "Meu irmão"), **Then** a fatura continua somando os R$ 100 no total, mas essa compra deixa de
   contar como gasto pessoal do usuário nas Estatísticas (gasto por categoria, maiores gastos
   etc.).
3. **Given** a mesma compra de R$ 70 dividida, **When** a outra pessoa manda R$ 40 de volta via
   Pix e o usuário registra essa entrada avulsa vinculando-a a essa compra, **Then** a
   responsabilidade da compra é recalculada automaticamente para R$ 30 (R$ 70 − R$ 40), sem
   precisar de edição manual, e a entrada de R$ 40 continua contando normalmente no saldo do mês.
4. **Given** uma compra sem nenhuma divisão registrada, **When** o usuário a visualiza, **Then**
   sua responsabilidade é igual ao valor total da compra (comportamento padrão, sem mudança para
   quem não usa a feature).
5. **Given** uma compra parcelada em 3x de R$ 90 (R$ 30 cada) com responsabilidade manual
   definida como R$ 60 no total, **When** o usuário consulta cada fatura envolvida, **Then** cada
   parcela exibe R$ 20 de responsabilidade (mesma proporção de 2/3 aplicada em cada uma).

---

### Edge Cases

- Compra registrada exatamente no dia do fechamento do cartão: entra na fatura que fecha nesse
  mesmo dia (não na seguinte) — ver User Story 1, cenário 2.
- Dia de fechamento/vencimento/cobrança de assinatura configurado além do último dia de um mês
  mais curto (ex.: dia 31 em abril, ou 30/31 em fevereiro): o sistema ajusta automaticamente para
  o último dia válido daquele mês.
- Cartão arquivado/cancelado com parcelas ainda ativas: o cartão some das opções de nova compra e
  da sugestão de melhor cartão, mas continua gerando e exibindo faturas até a última parcela
  pendente ser quitada.
- Edição de uma compra parcelada após uma ou mais parcelas já estarem em uma fatura fechada ou
  paga: as parcelas já lançadas em faturas fechadas/pagas permanecem congeladas; apenas as
  parcelas em faturas ainda abertas refletem a edição.
- Assinatura que tem sua forma de pagamento alterada (ex.: de Pix para Cartão): a alteração afeta
  apenas as cobranças geradas a partir dali; cobranças já geradas no passado não são reescritas.
- Importação de um arquivo CSV com linhas inválidas ou incompletas (ex.: sem data ou sem valor):
  essas linhas são ignoradas e reportadas ao usuário como não importadas, sem interromper a
  importação das linhas válidas.
- Cadastro de uma compra parcelada cujo parcelamento já está em andamento (parte das parcelas já
  foi paga antes de o usuário começar a usar o app): o sistema permite informar em qual parcela o
  usuário está atualmente, e passa a gerar apenas as parcelas restantes a partir dali, sem exigir o
  cadastro retroativo das parcelas já pagas.
- Tentativa de informar uma parcela atual maior que a quantidade total de parcelas (ou menor que
  1): o sistema impede o cadastro e avisa o usuário do erro.
- Uma transação já associada manualmente a um estabelecimento (seja por reconhecimento automático
  confirmado, seja por correção manual do usuário) NÃO é sobrescrita automaticamente quando um
  novo padrão de outro estabelecimento passar a coincidir com seu texto.
- Ausência de conexão com a internet ao tentar obter o logotipo de um estabelecimento: o cadastro
  do estabelecimento e a exibição de suas transações continuam funcionando normalmente, usando o
  ícone de respaldo, sem travar nem atrasar a tela.
- Dois estabelecimentos diferentes com padrões que coincidem com o texto de uma mesma transação:
  o sistema aplica um critério determinístico de desempate (ver Assumptions) em vez de associar
  arbitrariamente ou deixar ambíguo.
- Exclusão de uma categoria personalizada que já está em uso por transações existentes: essas
  transações passam a exibir o ícone padrão genérico ("Outros"), sem perder nenhum outro dado.
- Consultar a tela de estatísticas quando não há dado do período anterior para comparar (ex.:
  primeiro mês de uso do app): o sistema indica a ausência de comparação, em vez de calcular ou
  exibir uma variação percentual incorreta.
- Consultar a tela de estatísticas sem nenhuma renda mensal configurada: o sistema exibe
  normalmente o total gasto e a comparação com o período anterior, mas omite a seção de "consumo
  ideal" (que depende de uma renda configurada).
- Tentativa de definir um valor de responsabilidade negativo ou maior que o valor total da
  compra: o sistema impede e avisa o usuário do erro.
- Uma compra tem tanto um valor de responsabilidade definido manualmente quanto uma ou mais
  entradas avulsas vinculadas a ela: o valor calculado a partir das entradas vinculadas
  prevalece sobre o valor manual, por ser baseado em dinheiro realmente recebido (ver
  Assumptions).
- Uma entrada avulsa vinculada a uma compra é desvinculada ou excluída pelo usuário: a
  responsabilidade da compra é recalculada sem considerá-la (voltando ao valor manual definido,
  se houver, ou ao valor total da compra, caso contrário).
- Várias entradas avulsas vinculadas à mesma compra (ex.: duas pessoas reembolsando partes
  diferentes): a soma de todas as entradas vinculadas é subtraída do valor total da compra.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir cadastrar cartões de crédito com nome, dia de fechamento da
  fatura e dia de vencimento do pagamento.
- **FR-002**: O sistema DEVE determinar automaticamente, para cada cartão, em qual fatura mensal
  uma compra se enquadra, com base na data da compra e no dia de fechamento do cartão; uma compra
  feita no próprio dia do fechamento entra na fatura que fecha naquele dia.
- **FR-003**: O sistema DEVE permitir registrar uma compra informando forma de pagamento (Pix ou
  Cartão), valor total, data da compra e nome/descrição.
- **FR-004**: Quando a forma de pagamento for Cartão, o sistema DEVE permitir informar a
  quantidade total de parcelas da compra e, opcionalmente, qual parcela é a parcela atual (a
  próxima a vencer) — usado para cadastrar compras cujo parcelamento já está em andamento antes da
  adoção do app. Quando não informada, a parcela atual é assumida como a 1ª (compra nova).
- **FR-005**: O sistema DEVE impedir o cadastro de uma compra parcelada quando o número da parcela
  atual informado for maior que a quantidade total de parcelas, ou menor que 1.
- **FR-006**: Quando uma compra no cartão for parcelada, o sistema DEVE dividir automaticamente o
  valor total informado pela quantidade total de parcelas para obter o valor de cada parcela, e
  distribuir uma parcela em cada fatura mensal consecutiva, começando pela parcela atual (1ª por
  padrão) e indo até a última parcela. A parcela atual é alocada na fatura em que a compra se
  enquadra (determinada pela data da compra, conforme FR-002); parcelas anteriores à parcela atual
  não são criadas, pois representam parcelas já pagas antes do cadastro no app.
- **FR-007**: O sistema DEVE permitir criar tags personalizadas e associá-las a qualquer compra,
  bem como adicionar comentários livres a qualquer compra.
- **FR-008**: Todas as parcelas de uma mesma compra DEVEM compartilhar as mesmas tags e
  comentários da compra original.
- **FR-009**: O sistema DEVE permitir importar transações de um cartão via upload de arquivo CSV,
  reconhecendo automaticamente data da compra, valor e nome/descrição de cada transação.
- **FR-010**: O sistema DEVE suportar pelo menos dois formatos de CSV na importação: um formato
  genérico definido pelo próprio sistema, e o formato de exportação de fatura do Nubank.
- **FR-011**: O sistema DEVE calcular e exibir o valor total a pagar em cada fatura mensal de cada
  cartão, somando todas as parcelas e compras à vista que se enquadram naquele mês de referência.
- **FR-012**: O sistema DEVE sugerir, a partir da data atual, qual cartão é mais vantajoso para uma
  nova compra, priorizando o cartão cuja fatura correspondente (considerando o próximo fechamento e
  o vencimento daquele cartão) resulta no maior prazo total até o pagamento.
- **FR-013**: O sistema DEVE permitir configurar um valor de renda/salário mensal, que pode ser
  atualizado pelo usuário a qualquer momento, sem apagar o valor que esteve vigente em meses
  anteriores.
- **FR-014**: O sistema DEVE permitir registrar entradas avulsas de dinheiro no saldo do mês
  corrente a qualquer momento (ex.: um valor recebido de um trabalho extra).
- **FR-015**: O sistema DEVE calcular o saldo do mês considerando a renda mensal vigente, as
  entradas avulsas do mês, as compras via Pix realizadas no mês, e o valor das faturas de cartão
  que vencem naquele mês.
- **FR-016**: O sistema DEVE permitir cadastrar assinaturas recorrentes com nome, valor, forma de
  pagamento (Pix ou Cartão) e dia do mês de cobrança.
- **FR-017**: Assinaturas DEVEM se comportar como uma compra normal (aceitando tags e
  comentários) e o sistema DEVE gerar automaticamente uma nova cobrança todo mês, na data
  configurada, sem exigir ação manual do usuário.
- **FR-018**: O sistema DEVE exibir uma tela com todas as assinaturas ativas e o valor total
  mensal somado delas.
- **FR-019**: O sistema DEVE permitir cadastrar uma ou mais reservas de dinheiro guardado, cada
  uma com nome e saldo acumulado próprio.
- **FR-020**: O sistema DEVE permitir registrar lançamentos manuais de rendimento em uma reserva
  (valor e data informados pelo usuário), somando-os ao saldo acumulado da reserva.
- **FR-021**: O sistema DEVE permitir configurar uma taxa de rendimento mensal (percentual) por
  reserva; a aplicação automática dessa taxa mês a mês está fora do escopo desta versão inicial
  (ver Assumptions) — apenas o cadastro da taxa é obrigatório agora.
- **FR-022**: O sistema DEVE funcionar inteiramente offline para todas as suas funcionalidades
  essenciais, sem exigir login ou cadastro de usuário; nenhuma funcionalidade essencial pode
  depender de conexão com a internet para funcionar (exceções pontuais de enriquecimento opcional,
  como a busca de logotipo descrita em FR-036, nunca são pré-requisito de nenhuma funcionalidade).
- **FR-023**: O sistema DEVE permitir exportar todos os dados do usuário (cartões, faturas,
  compras, parcelas, tags, assinaturas, reservas e configuração de renda) para um arquivo de
  backup local.
- **FR-024**: O sistema DEVE permitir importar um arquivo de backup previamente exportado; ao
  importar, os dados atuais do dispositivo são substituídos integralmente pelo conteúdo do backup
  (restauração completa, não mesclagem).
- **FR-025**: O sistema DEVE permitir arquivar/cancelar um cartão sem apagar seu histórico de
  faturas e compras passadas; um cartão arquivado com parcelas ainda ativas DEVE continuar gerando
  e exibindo suas faturas mensais até a última parcela pendente ser quitada, mas DEVE deixar de
  aparecer como opção para novas compras ou na sugestão de melhor cartão.
- **FR-026**: O sistema DEVE ignorar e reportar ao usuário, sem interromper a importação, qualquer
  linha de um arquivo CSV importado que esteja incompleta ou inválida (ex.: sem data ou sem
  valor).
- **FR-027**: O sistema DEVE disponibilizar um conjunto de categorias de transação pré-definidas
  (ex.: Compras, Transporte, Alimentação, Assinaturas, Saúde, Lazer, Outros), cada uma com um
  ícone padrão associado.
- **FR-028**: O sistema DEVE permitir ao usuário criar categorias personalizadas, informando nome
  e escolhendo um ícone entre os disponíveis no app.
- **FR-029**: O sistema DEVE permitir associar uma categoria (pré-definida ou personalizada) a
  qualquer transação; esse campo é opcional.
- **FR-030**: O sistema DEVE exibir, em toda listagem de transações, um avatar/ícone ao lado de
  cada uma, seguindo esta ordem de prioridade: (1) o avatar do estabelecimento associado, quando
  houver; (2) o ícone da categoria associada, quando não houver estabelecimento; (3) um ícone
  padrão genérico ("Outros"), quando não houver nem estabelecimento nem categoria.
- **FR-031**: O sistema DEVE permitir cadastrar estabelecimentos com nome de exibição, um ícone de
  respaldo (obrigatório, escolhido pelo usuário entre os disponíveis no app), opcionalmente um
  domínio de site, e um ou mais padrões de reconhecimento (textos) associados a cada
  estabelecimento.
- **FR-032**: O cadastro de um estabelecimento DEVE poder ser feito tanto em uma tela dedicada de
  gerenciamento de estabelecimentos quanto diretamente a partir da tela de edição de uma
  transação — nesse caso, o sistema DEVE sugerir automaticamente um padrão inicial com base no
  texto da transação atual.
- **FR-033**: Ao registrar ou importar uma transação, o sistema DEVE verificar se a descrição da
  transação contém — sem diferenciar maiúsculas de minúsculas — algum padrão cadastrado de algum
  estabelecimento e, em caso positivo, associar automaticamente a transação a esse estabelecimento,
  substituindo a exibição do texto bruto pelo nome de exibição do estabelecimento.
- **FR-034**: O sistema DEVE permitir ao usuário associar ou remover manualmente o estabelecimento
  de qualquer transação, mesmo quando nenhum padrão automático tiver sido reconhecido, ou para
  corrigir uma associação automática incorreta; uma associação feita ou corrigida manualmente pelo
  usuário NÃO DEVE ser sobrescrita automaticamente por futuras atualizações de padrões.
- **FR-035**: Quando um novo padrão for adicionado a um estabelecimento (ou um novo estabelecimento
  for criado), o sistema DEVE reavaliar as transações já existentes que ainda não têm um
  estabelecimento atribuído manualmente, associando automaticamente aquelas cuja descrição
  corresponda ao novo padrão.
- **FR-036**: Quando o dispositivo tiver conexão com a internet disponível, o sistema PODE tentar
  obter automaticamente um logotipo oficial de um estabelecimento a partir do domínio de site
  informado, armazenando o resultado localmente para uso futuro offline; essa busca NÃO DEVE
  bloquear, atrasar perceptivelmente, ou ser pré-requisito para nenhuma outra funcionalidade do
  app, e sua ausência ou falha DEVE sempre resultar no uso do ícone de respaldo escolhido
  manualmente pelo usuário.
- **FR-037**: O sistema DEVE permitir excluir uma categoria personalizada; transações que a
  utilizavam DEVEM passar a exibir o ícone padrão genérico ("Outros"), sem perda de nenhum outro
  dado da transação.
- **FR-038**: O sistema DEVE exibir, na tela inicial, um gráfico do consumo mensal recente,
  permitindo ao usuário tocar nele para abrir a tela de estatísticas detalhada.
- **FR-039**: A tela de estatísticas DEVE permitir ao usuário alternar o período de análise entre
  diário, semanal, mensal (padrão) e anual, recalculando todos os valores exibidos para o período
  escolhido.
- **FR-040**: O sistema DEVE calcular e exibir o valor total gasto no período selecionado,
  considerando compras via Pix e parcelas de cartão cuja data se enquadra nesse período.
- **FR-041**: O sistema DEVE comparar o valor gasto no período selecionado com o valor gasto no
  período equivalente imediatamente anterior (ex.: mês atual vs. mês anterior), exibindo a
  variação percentual entre eles; quando não houver dado do período anterior, o sistema DEVE
  indicar a ausência de comparação em vez de calcular uma variação incorreta.
- **FR-042**: O sistema DEVE permitir configurar opcionalmente uma meta de consumo ideal como um
  percentual da renda mensal vigente, e comparar o gasto do período selecionado com essa meta
  quando ela estiver configurada; quando não configurada, a seção de meta/ideal não é exibida.
- **FR-043**: O sistema DEVE exibir, na tela de estatísticas, o valor gasto em cada categoria
  dentro do período selecionado.
- **FR-044**: O sistema DEVE exibir, na tela de estatísticas, uma lista das compras de maior valor
  dentro do período selecionado.
- **FR-045**: O sistema DEVE exibir, na tela de estatísticas, o percentual do gasto do período
  selecionado que corresponde a assinaturas recorrentes ativas, separando-o do restante do gasto
  variável.
- **FR-046**: O sistema DEVE permitir, ao registrar ou editar uma compra, informar opcionalmente
  um "valor de responsabilidade" diferente do valor total da compra — representando quanto dessa
  compra é de fato um gasto pessoal do usuário, podendo ser menor que o total, inclusive zero,
  quando a compra não é do usuário.
- **FR-047**: O sistema DEVE permitir associar um "motivo" (texto livre, opcional) e um
  "responsável" (texto livre, opcional — nome da pessoa responsável pela diferença) sempre que o
  valor de responsabilidade for definido manualmente e for diferente do valor total.
- **FR-048**: O sistema DEVE impedir que o valor de responsabilidade de uma compra seja negativo
  ou maior que o valor total dessa compra.
- **FR-049**: Quando nenhum valor de responsabilidade for definido manualmente e nenhuma entrada
  avulsa estiver vinculada, o sistema DEVE considerar, por padrão, que a responsabilidade do
  usuário é igual ao valor total da compra — comportamento inalterado para quem não usa esta
  funcionalidade.
- **FR-050**: O sistema DEVE permitir vincular uma ou mais entradas avulsas a uma compra
  específica, para registrar reembolsos recebidos de terceiros referentes àquela compra.
- **FR-051**: Quando uma ou mais entradas avulsas estiverem vinculadas a uma compra, o sistema
  DEVE recalcular automaticamente o valor de responsabilidade dessa compra como o valor total
  menos a soma das entradas vinculadas, sem exigir que o usuário digite esse valor manualmente;
  esse valor calculado prevalece sobre qualquer valor de responsabilidade definido manualmente
  para a mesma compra.
- **FR-052**: O sistema DEVE continuar somando o valor TOTAL de cada compra — sem considerar
  nenhuma divisão de responsabilidade — para calcular o valor a pagar em cada fatura mensal
  (FR-011) e o saldo do mês (FR-015); a divisão de responsabilidade NÃO DEVE alterar quanto o
  usuário precisa pagar ao emissor do cartão. Uma entrada avulsa vinculada a uma compra DEVE, por
  outro lado, continuar contando normalmente no saldo do mês, como qualquer outra entrada avulsa.
- **FR-053**: O sistema DEVE exibir, em toda tela onde o valor total de uma fatura é mostrado
  (Fatura · Detalhe, Cartão · Faturas), tanto o valor total da fatura quanto a soma das
  responsabilidades do usuário nas compras daquela fatura, sempre que houver ao menos uma compra
  com responsabilidade diferente do valor total.
- **FR-054**: As telas de Estatísticas (gasto por período, gasto por categoria, maiores gastos)
  DEVEM considerar o valor de responsabilidade de cada compra — e não o valor total — para
  refletir o gasto pessoal real do usuário.
- **FR-055**: Quando uma compra parcelada tiver um valor de responsabilidade diferente do total,
  o sistema DEVE aplicar a mesma proporção (responsabilidade ÷ total) a cada parcela
  individualmente, refletindo-a na fatura correspondente a cada parcela.

### Key Entities *(include if feature involves data)*

- **Cartão**: representa um cartão de crédito do usuário — nome, dia de fechamento, dia de
  vencimento, e se está ativo ou arquivado.
- **Fatura**: representa o ciclo mensal de cobrança de um cartão específico — mês/ano de
  referência, data de fechamento, data de vencimento e o valor total resultante da soma de suas
  parcelas/compras.
- **Compra**: representa uma transação financeira única — descrição, valor total original, data,
  forma de pagamento (Pix ou Cartão), cartão associado (quando aplicável), quantidade total de
  parcelas, parcela atual informada no cadastro (para compras cujo parcelamento já estava em
  andamento; 1 por padrão), tags, comentário, categoria associada (opcional), estabelecimento
  associado (opcional, automático ou manual), valor de responsabilidade (opcional; padrão = valor
  total), motivo e responsável (opcionais, usados quando a responsabilidade é definida
  manualmente), e origem (lançamento manual, importação de CSV ou geração automática por
  assinatura).
- **Parcela**: representa a fração de uma Compra feita no cartão que recai sobre uma Fatura
  específica; toda Compra no cartão gera ao menos uma Parcela (mesmo compras à vista), identificada
  por um número dentro do total de parcelas da Compra (ex.: parcela 5 de 12) — esse número pode
  começar diferente de 1 quando o parcelamento já estava em andamento antes do cadastro no app — e
  herda as tags/comentário da Compra original.
- **Tag**: rótulo criado pelo usuário para categorizar compras; uma Compra pode ter várias tags.
- **Assinatura**: representa uma cobrança recorrente mensal — nome, valor, forma de pagamento, dia
  de cobrança e se está ativa; gera automaticamente uma nova Compra a cada mês.
- **Configuração de Renda**: representa o valor de renda/salário mensal vigente a partir de uma
  determinada data, preservando o histórico de valores anteriores.
- **Entrada Avulsa**: representa um valor adicional recebido em um mês específico, fora da renda
  mensal configurada; pode opcionalmente estar vinculada a uma Compra específica, quando representa
  um reembolso recebido de terceiros por aquela compra.
- **Reserva de Dinheiro Guardado**: representa um "cofre" de dinheiro guardado pelo usuário — nome
  e saldo acumulado.
- **Lançamento de Reserva**: representa uma movimentação em uma Reserva — depósito, retirada ou
  rendimento (manual ou, futuramente, automático a partir de uma taxa configurada).
- **Lote de Importação**: representa uma operação de importação de arquivo CSV — cartão de
  destino, formato utilizado, e quantas transações foram importadas ou ignoradas.
- **Categoria**: representa um tipo de gasto (ex.: Compras, Transporte, Alimentação) — nome,
  ícone e se é pré-definida ou personalizada pelo usuário. Diferente de Tag: uma transação tem no
  máximo uma Categoria (usada para o ícone de fallback), mas pode ter várias Tags.
  Categorias personalizadas podem ser excluídas; categorias pré-definidas não.
  A categoria genérica "Outros" sempre existe e serve de ícone final de fallback.
- **Estabelecimento**: representa um comerciante conhecido pelo usuário — nome de exibição, ícone
  de respaldo (obrigatório), domínio do site (opcional, usado para busca de logotipo), logotipo em
  cache (opcional, obtido quando há internet disponível) e uma ou mais Padrões de Reconhecimento
  associados.
- **Padrão de Reconhecimento**: representa um texto (slug) associado a um Estabelecimento, usado
  para reconhecer automaticamente transações cuja descrição o contenha (ex.: "UBER" associado ao
  Estabelecimento "Uber").
- **Meta de Consumo Ideal**: representa um percentual da renda mensal vigente que o usuário
  considera o gasto ideal; opcional — quando ausente, a tela de estatísticas não exibe comparação
  de gasto contra meta.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um novo usuário consegue cadastrar um cartão (nome, fechamento e vencimento) em
  menos de 1 minuto.
- **SC-002**: Ao registrar uma compra parcelada — inclusive uma cujo parcelamento já está em
  andamento, informando a parcela atual — o sistema exibe corretamente em quais meses/faturas cada
  parcela restante vai aparecer, sem que o usuário precise fazer qualquer cálculo manual.
- **SC-003**: O valor total de uma fatura mensal exibido pelo sistema corresponde exatamente à
  soma de todas as parcelas e compras à vista daquele mês, sem divergência, em 100% dos casos de
  teste realizados.
- **SC-004**: Um usuário consegue importar uma fatura com 30 ou mais transações via CSV em menos
  de 2 minutos, sem digitar nenhuma transação manualmente.
- **SC-005**: Um usuário consegue visualizar o total mensal gasto com assinaturas em uma única
  tela, sem precisar somar valores manualmente.
- **SC-006**: Ao consultar a sugestão de melhor cartão, o usuário recebe uma recomendação única e
  clara de qual cartão usar hoje, sem precisar calcular prazos manualmente.
- **SC-007**: Um usuário consegue exportar um backup completo dos dados e restaurá-lo,
  recuperando 100% das informações previamente salvas.
- **SC-008**: O aplicativo abre e todas as suas funcionalidades essenciais continuam operando
  normalmente sem qualquer conexão de rede disponível.
- **SC-009**: Depois de cadastrar um estabelecimento com um padrão que cobre variações já vistas
  em transações anteriores, todas elas passam a exibir automaticamente o nome e avatar corretos,
  sem exigir edição manual uma a uma.
- **SC-010**: Um usuário consegue identificar visualmente, sem precisar ler o texto bruto da
  transação, a maioria das compras mais frequentes (via avatar do estabelecimento ou ícone da
  categoria).
- **SC-011**: Um usuário consegue ver quanto gastou no mês atual comparado ao mês anterior em no
  máximo 2 toques a partir da tela inicial.
- **SC-012**: Um usuário consegue identificar, sem cálculo manual, quais foram seus maiores gastos
  e em quais categorias mais gastou dentro de qualquer período selecionado.
- **SC-013**: Um usuário que compartilha o cartão com familiares consegue ver, para qualquer
  fatura, tanto o valor total quanto quanto disso é responsabilidade pessoal dele, sem precisar
  calcular à mão.
- **SC-014**: Ao vincular um reembolso recebido a uma compra específica, o usuário não precisa
  fazer nenhum cálculo manual para saber quanto da compra ainda é responsabilidade dele.

## Assumptions

- O app é para uso de uma única pessoa, em um único dispositivo Android; não há necessidade de
  múltiplos usuários, perfis ou permissões de acesso.
- É usada uma única moeda (Real – BRL); não há suporte a múltiplas moedas nesta versão.
- Compras parceladas têm parcelas de valor igual (divisão simples do valor total pelo número de
  parcelas); eventual diferença de arredondamento é absorvida pela primeira parcela gerada (a
  parcela atual, quando o parcelamento já está em andamento).
- Ao cadastrar uma compra parcelada cujo parcelamento já está em andamento, o valor informado é
  sempre o valor total ORIGINAL da compra (não apenas o valor restante a pagar); o sistema deriva
  o valor de cada parcela dividindo esse total pela quantidade total de parcelas, e usa a parcela
  atual informada apenas para saber a partir de qual parcela deve alocar nas faturas seguintes.
- A aplicação automática mensal da taxa de rendimento configurada em uma Reserva (FR-021) é uma
  evolução futura declarada, fora do escopo de implementação desta versão; apenas o cadastro da
  taxa e os lançamentos manuais de rendimento fazem parte do escopo atual.
- O formato exato de colunas do CSV de exportação do Nubank será validado com um arquivo de
  exemplo real fornecido pelo usuário antes da fase de planejamento técnico; até lá, assume-se que
  cada linha traz ao menos data, valor e descrição da transação, podendo identificar parcelas
  através de um padrão textual na descrição (ex.: "Loja X - Parcela 2/3").
- Uma compra feita exatamente no dia do fechamento do cartão entra na fatura que fecha nesse
  mesmo dia (não na fatura seguinte).
- Um cartão arquivado/cancelado com parcelas ainda ativas continua gerando e exibindo suas faturas
  até a quitação total, mas deixa de aparecer como opção para novas compras.
- Importar um arquivo de backup substitui integralmente os dados existentes no dispositivo
  (restauração completa), em vez de mesclar com os dados atuais.
- A correspondência de padrão (slug) de estabelecimento é feita por "contém" (substring), sem
  diferenciar maiúsculas de minúsculas, comparando o padrão cadastrado contra a descrição bruta da
  transação.
- Quando dois ou mais estabelecimentos têm padrões que coincidem com a mesma descrição de
  transação, o padrão mais longo (mais específico) tem prioridade; em caso de empate de tamanho,
  vale o padrão do estabelecimento cadastrado há mais tempo.
- Categoria é um campo opcional por transação, de valor único (diferente de Tag, que é
  multivalorada e não carrega ícone); quando não definida, o ícone de fallback exibido é o da
  categoria genérica "Outros", que sempre existe e não pode ser excluída.
- O ícone de respaldo de um estabelecimento é obrigatório no cadastro (garante que sempre haja um
  avatar, mesmo offline ou sem logotipo encontrado) e vem de uma biblioteca de ícones/emojis já
  disponível no app — sem necessidade de upload de imagem própria nesta versão.
- A busca de logotipo oficial de um estabelecimento a partir do domínio informado é uma
  funcionalidade de enriquecimento best-effort que depende de conexão com a internet; o app
  permanece 100% utilizável sem ela, conforme o Princípio I (emendado) da constituição do
  projeto — o ícone de respaldo manual nunca deixa de funcionar como avatar.
- Os períodos selecionáveis na tela de estatísticas são Diário, Semanal, Mensal e Anual, com
  "Mensal" como padrão ao abrir a tela a partir do gráfico da tela inicial.
- A meta de consumo ideal é sempre definida como um percentual da renda mensal vigente (não um
  valor fixo em R$); sua ausência apenas oculta a comparação correspondente, sem impedir o
  restante da tela de estatísticas de funcionar.
- O percentual "comprometido com assinaturas" no período selecionado é calculado sobre o total
  gasto no próprio período (assinaturas ÷ total gasto), e não sobre a renda mensal, para refletir
  a composição real do gasto naquele período.
- A divisão de responsabilidade de uma compra (FR-046 a FR-055) nunca altera o valor total da
  fatura nem o saldo do mês diretamente — confirmado com o usuário. O valor a pagar na fatura e o
  saldo do mês sempre consideram o valor TOTAL de cada compra, porque é esse o valor
  efetivamente cobrado pelo emissor do cartão; apenas entradas avulsas reais (vinculadas a uma
  compra ou não) afetam o saldo do mês. O valor de responsabilidade é uma lente informativa
  adicional, usada para refletir o gasto pessoal real do usuário nas Estatísticas e como
  informação complementar ao lado do total da fatura — nunca em substituição a ele.
- Quando uma compra tem tanto um valor de responsabilidade definido manualmente quanto uma ou
  mais entradas avulsas vinculadas a ela, o valor calculado a partir das entradas vinculadas
  prevalece sobre o valor manual, por ser baseado em dinheiro realmente recebido; o valor manual
  só é considerado quando não há nenhuma entrada vinculada à compra.
- O campo "responsável" de uma compra é um texto livre por compra (não há cadastro estruturado de
  pessoas/contatos nesta versão); compras divididas entre mais de duas partes usam esse mesmo
  campo livre para anotar quem mais está envolvido.
- Compras parceladas com responsabilidade diferente do total dividem essa responsabilidade
  proporcionalmente entre todas as parcelas (mesma fração aplicada em cada fatura).
