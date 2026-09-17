import { Stack } from 'expo-router';

/**
 * Cartões tab stack: list -> card detail -> invoice detail, plus the
 * nova-compra and importar-csv sub-flows. Headers are custom per-screen
 * (matching the design-brief mockups), so the native header is hidden.
 */
export default function CartoesStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="novo" options={{ presentation: 'modal' }} />
      <Stack.Screen name="[cardId]/index" />
      <Stack.Screen name="[cardId]/fatura/[invoiceId]" />
      <Stack.Screen name="nova-compra/index" />
      <Stack.Screen name="nova-compra/categoria" options={{ presentation: 'modal' }} />
      <Stack.Screen name="nova-compra/estabelecimento" options={{ presentation: 'modal' }} />
      <Stack.Screen name="nova-compra/divisao-manual" options={{ presentation: 'modal' }} />
      <Stack.Screen name="nova-compra/divisao-vinculada" options={{ presentation: 'modal' }} />
      <Stack.Screen name="importar-csv/index" />
      <Stack.Screen name="importar-csv/resultado" />
    </Stack>
  );
}
