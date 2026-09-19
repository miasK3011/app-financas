import { Tabs } from 'expo-router';
import { CreditCard, Ellipsis, House, Receipt } from 'lucide-react-native';

import { colors } from '@/theme/colors';

/**
 * Bottom tab bar (002-central-de-compras, FR-001): 4 abas — House
 * (Início), CreditCard (Cartões), Receipt (Compras), Ellipsis (Mais).
 * Cor ativa = `$primary`, inativa = `$textTertiary`, substituindo o
 * azul padrão do React Navigation. Assinaturas e Reservas deixaram de
 * ser abas próprias (FR-002) — vivem dentro de Mais agora
 * (`(tabs)/mais/assinaturas`, `(tabs)/mais/reservas`).
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cartoes"
        options={{
          title: 'Cartões',
          tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="compras"
        options={{
          title: 'Compras',
          tabBarIcon: ({ color, size }) => <Receipt color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="mais"
        options={{
          title: 'Mais',
          tabBarIcon: ({ color, size }) => <Ellipsis color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
