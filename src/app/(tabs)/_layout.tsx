import { Tabs } from 'expo-router';

/**
 * Bottom tab bar per design-brief.md §3.1: Início, Cartões, Assinaturas,
 * Reservas, Mais. Icons/labels/theme are wired up in a later task —
 * this is the navigational skeleton only (T007).
 */
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="inicio" options={{ title: 'Início' }} />
      <Tabs.Screen name="cartoes" options={{ title: 'Cartões' }} />
      <Tabs.Screen name="assinaturas" options={{ title: 'Assinaturas' }} />
      <Tabs.Screen name="reservas" options={{ title: 'Reservas' }} />
      <Tabs.Screen name="mais" options={{ title: 'Mais' }} />
    </Tabs>
  );
}
