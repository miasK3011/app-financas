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

### User Story 4 - Comprar parcelado e ver a divisão automática entre faturas (Priority: P1)

Como usuário, quero informar o valor total e o número de parcelas de uma compra no cartão, para
que o app calcule e distribua automaticamente cada parcela na fatura mensal correspondente, sem eu
precisar fazer essa conta manualmente.

**Why this priority**: É um dos pedidos centrais do app — parcelamento incorreto quebra a
confiança no cálculo de fatura de meses futuros.

**Independent Test**: Pode ser testado registrando uma compra de valor conhecido em N parcelas e
conferindo se cada uma das N faturas seguintes recebe a fração correta do valor, todas com as
mesmas tags/comentários da compra original.

**Acceptance Scenarios**:

1. **Given** uma compra de R$ 300 em 3 parcelas no dia 5 (cartão com fechamento dia 10), **When**
   o usuário salva a compra, **Then** o sistema cria 3 parcelas de R$ 100, uma na fatura do mês
   corrente e uma em cada uma das duas faturas seguintes.
2. **Given** essa mesma compra parcelada, **When** o usuário adiciona uma tag a ela, **Then** a
   tag aparece em todas as 3 parcelas, pois pertencem à mesma compra original.

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
  quantidade de parcelas da compra.
- **FR-005**: Quando uma compra no cartão for parcelada, o sistema DEVE dividir automaticamente o
  valor total pelo número de parcelas e distribuir uma parcela em cada fatura mensal consecutiva,
  a partir da fatura em que a compra se enquadra.
- **FR-006**: O sistema DEVE permitir criar tags personalizadas e associá-las a qualquer compra,
  bem como adicionar comentários livres a qualquer compra.
- **FR-007**: Todas as parcelas de uma mesma compra DEVEM compartilhar as mesmas tags e
  comentários da compra original.
- **FR-008**: O sistema DEVE permitir importar transações de um cartão via upload de arquivo CSV,
  reconhecendo automaticamente data da compra, valor e nome/descrição de cada transação.
- **FR-009**: O sistema DEVE suportar pelo menos dois formatos de CSV na importação: um formato
  genérico definido pelo próprio sistema, e o formato de exportação de fatura do Nubank.
- **FR-010**: O sistema DEVE calcular e exibir o valor total a pagar em cada fatura mensal de cada
  cartão, somando todas as parcelas e compras à vista que se enquadram naquele mês de referência.
- **FR-011**: O sistema DEVE sugerir, a partir da data atual, qual cartão é mais vantajoso para uma
  nova compra, priorizando o cartão cuja fatura correspondente (considerando o próximo fechamento e
  o vencimento daquele cartão) resulta no maior prazo total até o pagamento.
- **FR-012**: O sistema DEVE permitir configurar um valor de renda/salário mensal, que pode ser
  atualizado pelo usuário a qualquer momento, sem apagar o valor que esteve vigente em meses
  anteriores.
- **FR-013**: O sistema DEVE permitir registrar entradas avulsas de dinheiro no saldo do mês
  corrente a qualquer momento (ex.: um valor recebido de um trabalho extra).
- **FR-014**: O sistema DEVE calcular o saldo do mês considerando a renda mensal vigente, as
  entradas avulsas do mês, as compras via Pix realizadas no mês, e o valor das faturas de cartão
  que vencem naquele mês.
- **FR-015**: O sistema DEVE permitir cadastrar assinaturas recorrentes com nome, valor, forma de
  pagamento (Pix ou Cartão) e dia do mês de cobrança.
- **FR-016**: Assinaturas DEVEM se comportar como uma compra normal (aceitando tags e
  comentários) e o sistema DEVE gerar automaticamente uma nova cobrança todo mês, na data
  configurada, sem exigir ação manual do usuário.
- **FR-017**: O sistema DEVE exibir uma tela com todas as assinaturas ativas e o valor total
  mensal somado delas.
- **FR-018**: O sistema DEVE permitir cadastrar uma ou mais reservas de dinheiro guardado, cada
  uma com nome e saldo acumulado próprio.
- **FR-019**: O sistema DEVE permitir registrar lançamentos manuais de rendimento em uma reserva
  (valor e data informados pelo usuário), somando-os ao saldo acumulado da reserva.
- **FR-020**: O sistema DEVE permitir configurar uma taxa de rendimento mensal (percentual) por
  reserva; a aplicação automática dessa taxa mês a mês está fora do escopo desta versão inicial
  (ver Assumptions) — apenas o cadastro da taxa é obrigatório agora.
- **FR-021**: O sistema DEVE funcionar inteiramente offline, sem exigir login, cadastro de usuário
  ou qualquer conexão com a internet para qualquer funcionalidade.
- **FR-022**: O sistema DEVE permitir exportar todos os dados do usuário (cartões, faturas,
  compras, parcelas, tags, assinaturas, reservas e configuração de renda) para um arquivo de
  backup local.
- **FR-023**: O sistema DEVE permitir importar um arquivo de backup previamente exportado; ao
  importar, os dados atuais do dispositivo são substituídos integralmente pelo conteúdo do backup
  (restauração completa, não mesclagem).
- **FR-024**: O sistema DEVE permitir arquivar/cancelar um cartão sem apagar seu histórico de
  faturas e compras passadas; um cartão arquivado com parcelas ainda ativas DEVE continuar gerando
  e exibindo suas faturas mensais até a última parcela pendente ser quitada, mas DEVE deixar de
  aparecer como opção para novas compras ou na sugestão de melhor cartão.
- **FR-025**: O sistema DEVE ignorar e reportar ao usuário, sem interromper a importação, qualquer
  linha de um arquivo CSV importado que esteja incompleta ou inválida (ex.: sem data ou sem
  valor).

### Key Entities *(include if feature involves data)*

- **Cartão**: representa um cartão de crédito do usuário — nome, dia de fechamento, dia de
  vencimento, e se está ativo ou arquivado.
- **Fatura**: representa o ciclo mensal de cobrança de um cartão específico — mês/ano de
  referência, data de fechamento, data de vencimento e o valor total resultante da soma de suas
  parcelas/compras.
- **Compra**: representa uma transação financeira única — descrição, valor total, data, forma de
  pagamento (Pix ou Cartão), cartão associado (quando aplicável), tags, comentário e origem
  (lançamento manual, importação de CSV ou geração automática por assinatura).
- **Parcela**: representa a fração de uma Compra feita no cartão que recai sobre uma Fatura
  específica; toda Compra no cartão gera ao menos uma Parcela (mesmo compras à vista), e herda as
  tags/comentário da Compra original.
- **Tag**: rótulo criado pelo usuário para categorizar compras; uma Compra pode ter várias tags.
- **Assinatura**: representa uma cobrança recorrente mensal — nome, valor, forma de pagamento, dia
  de cobrança e se está ativa; gera automaticamente uma nova Compra a cada mês.
- **Configuração de Renda**: representa o valor de renda/salário mensal vigente a partir de uma
  determinada data, preservando o histórico de valores anteriores.
- **Entrada Avulsa**: representa um valor adicional recebido em um mês específico, fora da renda
  mensal configurada.
- **Reserva de Dinheiro Guardado**: representa um "cofre" de dinheiro guardado pelo usuário — nome
  e saldo acumulado.
- **Lançamento de Reserva**: representa uma movimentação em uma Reserva — depósito, retirada ou
  rendimento (manual ou, futuramente, automático a partir de uma taxa configurada).
- **Lote de Importação**: representa uma operação de importação de arquivo CSV — cartão de
  destino, formato utilizado, e quantas transações foram importadas ou ignoradas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um novo usuário consegue cadastrar um cartão (nome, fechamento e vencimento) em
  menos de 1 minuto.
- **SC-002**: Ao registrar uma compra parcelada, o sistema exibe corretamente em quais meses/
  faturas cada parcela vai aparecer, sem que o usuário precise fazer qualquer cálculo manual.
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
- **SC-008**: O aplicativo abre e todas as suas funcionalidades continuam operando normalmente sem
  qualquer conexão de rede disponível.

## Assumptions

- O app é para uso de uma única pessoa, em um único dispositivo Android; não há necessidade de
  múltiplos usuários, perfis ou permissões de acesso.
- É usada uma única moeda (Real – BRL); não há suporte a múltiplas moedas nesta versão.
- Compras parceladas têm parcelas de valor igual (divisão simples do valor total pelo número de
  parcelas); eventual diferença de arredondamento é absorvida pela primeira parcela.
- A aplicação automática mensal da taxa de rendimento configurada em uma Reserva (FR-020) é uma
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
