import { Tabs } from 'expo-router';
import { CreditCard, Ellipsis, House, Layers, Repeat } from 'lucide-react-native';

import { colors } from '@/theme/colors';

/**
 * Bottom tab bar per design-brief.md §3.1 e Main.dc.html (Início) —
 * ícones lucide equivalentes aos desenhados no mockup: House (Início),
 * CreditCard (Cartões), Repeat (Assinaturas), Layers (Reservas),
 * Ellipsis (Mais). Cor ativa = `$primary`, inativa = `$textTertiary`,
 * substituindo o azul padrão do React Navigation.
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
        name="assinaturas"
        options={{
          title: 'Assinaturas',
          tabBarIcon: ({ color, size }) => <Repeat color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Reservas',
          tabBarIcon: ({ color, size }) => <Layers color={color} size={size} />,
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
