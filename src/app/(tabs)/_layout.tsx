import { Tabs } from 'expo-router';
import { CreditCard, Ellipsis, House, Layers, Receipt, Repeat } from 'lucide-react-native';

import { colors } from '@/theme/colors';

/**
 * Bottom tab bar per design-brief.md §3.1 e Main.dc.html (Início) —
 * ícones lucide equivalentes aos desenhados no mockup: House (Início),
 * CreditCard (Cartões), Receipt (Compras), Ellipsis (Mais). Cor ativa =
 * `$primary`, inativa = `$textTertiary`, substituindo o azul padrão do
 * React Navigation.
 *
 * 002-central-de-compras: Assinaturas e Reservas deixam de ser abas
 * próprias (FR-001/FR-002) — nesta fase intermediária (T008) elas
 * ainda convivem com a aba Compras recém-criada; T028 as remove daqui,
 * chegando ao estado final de 4 abas.
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
