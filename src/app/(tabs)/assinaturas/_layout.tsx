import { Stack } from 'expo-router';

/**
 * Assinaturas tab stack: list -> AssinaturaEditar, reused for both
 * creating a new subscription and editing an existing one (see
 * tasks.md T089).
 */
export default function AssinaturasStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[subscriptionId]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
