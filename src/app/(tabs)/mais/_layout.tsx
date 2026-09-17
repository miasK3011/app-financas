import { Stack } from 'expo-router';

/**
 * "Mais" tab stack: a simple menu (index) linking into the four
 * sections that don't get their own bottom tab — Renda, Categorias,
 * Estabelecimentos and Backup (see plan.md's navigation correction).
 */
export default function MaisStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="renda/index" />
      <Stack.Screen name="renda/historico" />
      <Stack.Screen name="renda/nova-entrada" options={{ presentation: 'modal' }} />
      <Stack.Screen name="categorias/index" />
      <Stack.Screen name="categorias/nova" options={{ presentation: 'modal' }} />
      <Stack.Screen name="estabelecimentos/index" />
      <Stack.Screen name="estabelecimentos/[establishmentId]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="backup/index" />
      <Stack.Screen name="backup/confirmar-restauracao" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
