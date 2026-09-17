import { Stack } from 'expo-router';

/**
 * Início tab stack: index is the tab root, estatisticas is a drill-down
 * reached by tapping the monthly-spend chart (no tab of its own — see
 * plan.md's navigation correction). Headers are custom per-screen
 * (matching the design-brief mockups), so the native header is hidden.
 */
export default function InicioStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="estatisticas" />
    </Stack>
  );
}
