# Quickstart: Validação da Central de Compras e Navegação Simplificada

Guia para validar manualmente, no app rodando (Expo Go), os cenários de aceite das três User
Stories desta feature. Assume que o app já tem a feature 001 implementada (cartões, compras, Pix,
assinaturas, reservas) — ver `specs/001-personal-finance-tracker/quickstart.md` para o setup base.

## Pré-requisitos

- Mesmo setup do `quickstart.md` da feature 001 (Node 20, Expo Go num Android físico ou emulador).
- Ter pelo menos: um cartão cadastrado, uma compra à vista via Pix no mês corrente, uma compra
  parcelada no cartão (3x ou mais) com pelo menos uma parcela já lançada para um mês futuro, e uma
  compra em pelo menos um mês passado.

## Cenário 1 — Todas as transações do mês, qualquer forma de pagamento (User Story 1, P1)

1. Abrir a aba "Compras" pela navegação inferior.
   **Esperado**: abre direto no mês corrente; a compra Pix e a parcela do cartão referente a este
   mês aparecem na mesma lista, cada uma com o selo da sua forma de pagamento.
2. Conferir o card de resumo no topo.
   **Esperado**: total do mês bate com a soma das duas transações; a divisão por forma de pagamento
   mostra os dois valores corretos.
3. Tocar no chip "Cartão".
   **Esperado**: some a compra Pix da lista, fica só a do cartão. Tocar em "Todos" traz as duas de
   volta.
4. Ir em Início → tocar em "Ver tudo" ao lado de "Transações recentes".
   **Esperado**: abre a aba Compras, mês corrente (mesmo estado do passo 1).
5. Tocar na compra parcelada da lista.
   **Esperado**: abre a mesma tela de detalhe/edição de compra já usada em Cartões.

## Cenário 2 — Navegação entre meses (User Story 2, P2)

1. Na aba Compras, tocar na seta para voltar até chegar no mês em que há uma compra cadastrada.
   **Esperado**: cada mês mostra seu próprio total e suas próprias transações; ao chegar no mês da
   compra mais antiga cadastrada, a seta de voltar fica desabilitada.
2. Voltar ao mês corrente e arrastar o dedo da direita para a esquerda sobre a área do navegador de
   mês.
   **Esperado**: mesmo efeito de tocar na seta de avançar — vai para o próximo mês.
3. Avançar mês a mês até o mês em que a parcela futura (do pré-requisito) está lançada.
   **Esperado**: esse mês mostra "Previsto para [mês]" com o total das parcelas daquele mês, e a
   lista agrupada por fatura (nome do cartão + data de vencimento) em vez de por dia; nenhum selo
   ou banner extra de "previsto" além da seta de avançar desabilitada.
4. Tentar avançar além desse mês.
   **Esperado**: seta de avançar aparece desabilitada — não é possível ir além.

## Cenário 3 — Navegação principal com 4 abas (User Story 3, P3)

1. Olhar a barra de navegação inferior.
   **Esperado**: exatamente 4 abas — Início, Cartões, Compras, Mais (nesta ordem).
2. Abrir "Mais".
   **Esperado**: itens organizados em 3 seções — "Planejamento" (Renda & Entradas, Assinaturas,
   Reservas), "Organização" (Categorias, Estabelecimentos), "Dados" (Backup).
3. Tocar em "Assinaturas" a partir de Mais, cadastrar/editar uma assinatura normalmente.
   **Esperado**: mesmo comportamento de antes da feature — só o caminho para chegar até ela mudou.
4. Repetir o passo 3 para "Reservas".

## Checagem de consistência entre telas

- Comparar o "Gastos" do mês exibido na tela Início com o "Total gasto em [mês]" da tela Compras
  para o mesmo mês.
  **Esperado**: os dois valores são idênticos (mesma regra de atribuição de mês para parcelas de
  cartão — ver `contracts/purchases-overview.md`).
