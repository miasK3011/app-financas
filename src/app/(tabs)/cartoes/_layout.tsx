import { Stack } from 'expo-router';

/**
 * Cartões tab stack: apenas a lista e o modal de novo cartão. Headers
 * são custom por tela (mockups do design-brief), então o header nativo
 * fica escondido.
 *
 * O detalhe do cartão (`cartao/[cardId]`), o detalhe da fatura
 * (`cartao/[cardId]/fatura/[invoiceId]`), `importar-csv/*`,
 * `nova-compra/*` e `compra/[compraId]` NÃO vivem aqui — são alcançados
 * também de outras tabs (Início · Faturas do mês/Melhor cartão/
 * Transações recentes/FAB, Mais · Renda), e uma rota dentro do stack
 * aninhado de uma tab só "fecha" de verdade quando fica em cima do
 * stack daquela MESMA tab; ao empurrá-la a partir de outra tab, o Expo
 * Router muda a tab ativa e empilha por baixo dos panos nesta stack,
 * então voltar não a remove daqui — trocar de tab de novo reexibe essa
 * tela travada no topo (bug relatado pelo usuário duas vezes: primeiro
 * com Editar Compra, depois com o detalhe da fatura do Nubank aberto
 * a partir do card "Faturas do mês" da Início). Por isso vivem em
 * `src/app/cartao/`, `src/app/nova-compra/` e `src/app/compra/`,
 * registradas no Stack raiz (`src/app/_layout.tsx`) — fora de qualquer
 * tab, então empilham/desempilham igual não importa de qual tab foram
 * abertas.
 */
export default function CartoesStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="novo" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
