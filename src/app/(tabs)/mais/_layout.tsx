import { Stack } from 'expo-router';

/**
 * "Mais" tab stack: um menu (index) organizado em seções
 * (002-central-de-compras, FR-003) linkando pra Categorias,
 * Estabelecimentos, Backup, e — desde que deixaram de ser abas
 * próprias (FR-001/FR-002) — Assinaturas e Reservas. Seguro aninhar as
 * duas aqui porque nenhuma outra tela do app navega direto pra elas
 * (só a própria aba antiga fazia, e ela deixou de existir).
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
      <Stack.Screen name="assinaturas/index" />
      <Stack.Screen name="assinaturas/[subscriptionId]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="reservas/index" />
      <Stack.Screen name="reservas/[reserveId]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="categorias/index" />
      <Stack.Screen name="categorias/nova" options={{ presentation: 'modal' }} />
      <Stack.Screen name="estabelecimentos/index" />
      <Stack.Screen name="estabelecimentos/[establishmentId]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="backup/index" />
      <Stack.Screen name="backup/confirmar-restauracao" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
