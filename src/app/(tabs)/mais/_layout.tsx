import { Stack } from 'expo-router';

/**
 * "Mais" tab stack: a simple menu (index) linking into the sections
 * that don't get their own bottom tab — Categorias, Estabelecimentos e
 * Backup (see plan.md's navigation correction).
 *
 * `renda/*` NÃO vive aqui — também é aberto a partir da Início
 * ("Consumo mensal"/"Editar renda"), e uma rota dentro do stack
 * aninhado desta tab só "fecha" de verdade se aberta a partir desta
 * MESMA tab (ver comentário em `(tabs)/cartoes/_layout.tsx` sobre o bug
 * de tab cruzada). Por isso vive em `src/app/renda/`, registrada no
 * Stack raiz (`src/app/_layout.tsx`).
 */
export default function MaisStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="categorias/index" />
      <Stack.Screen name="categorias/nova" options={{ presentation: 'modal' }} />
      <Stack.Screen name="estabelecimentos/index" />
      <Stack.Screen name="estabelecimentos/[establishmentId]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="backup/index" />
      <Stack.Screen name="backup/confirmar-restauracao" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
