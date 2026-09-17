import { Stack } from 'expo-router';

/**
 * Reservas tab stack: list -> ReservaDetalhe, reused for both creating
 * a new reserve and viewing/editing an existing one (see tasks.md T125).
 */
export default function ReservasStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[reserveId]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
