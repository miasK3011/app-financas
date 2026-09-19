import { Stack } from 'expo-router';

/**
 * Cartões tab stack: list -> card detail -> invoice detail, plus the
 * importar-csv sub-flow. Headers are custom per-screen (matching the
 * design-brief mockups), so the native header is hidden.
 *
 * `nova-compra/*` e `compra/[compraId]` NÃO vivem aqui — são
 * alcançados também de outras tabs (Início · Transações recentes/FAB,
 * Mais · Renda), e uma rota dentro do stack aninhado de uma tab só
 * "fecha" de verdade quando fica em cima do stack daquela MESMA tab; ao
 * empurrá-la a partir de outra tab, o Expo Router muda a tab ativa e
 * empilha por baixo dos panos nesta stack, então voltar não a remove
 * daqui — trocar de tab de novo reexibe essa tela travada no topo (bug
 * relatado pelo usuário: X/voltar ia pra Início, mas a aba Cartões
 * ainda mostrava a compra). Por isso moveram para `src/app/nova-compra/`
 * e `src/app/compra/`, registradas no Stack raiz (`src/app/_layout.tsx`)
 * — fora de qualquer tab, então empilham/desempilham igual não importa
 * de qual tab foram abertas.
 */
export default function CartoesStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="novo" options={{ presentation: 'modal' }} />
      <Stack.Screen name="[cardId]/index" />
      <Stack.Screen name="[cardId]/fatura/[invoiceId]" />
      <Stack.Screen name="importar-csv/index" />
      <Stack.Screen name="importar-csv/resultado" />
    </Stack>
  );
}
