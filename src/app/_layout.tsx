import { Stack } from 'expo-router';

/**
 * Root stack. The Drizzle migration boot-gate (T025) and the Tamagui
 * provider (T027) wrap this component once Phase 2 lands.
 */
export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
