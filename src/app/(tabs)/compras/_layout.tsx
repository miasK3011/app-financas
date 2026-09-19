import { Stack } from 'expo-router';

/** Compras tab stack: só a raiz por enquanto (002-central-de-compras). */
export default function ComprasStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
