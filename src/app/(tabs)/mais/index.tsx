import { useRouter, type Href } from 'expo-router';
import { ChevronRight, Layers, Repeat, Store, Tag, UploadCloud, Wallet } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { ScrollView, Text, XStack, YStack } from 'tamagui';

import { IconAvatar } from '@/components/IconAvatar';
import { Screen } from '@/components/Screen';

type MenuItem = {
  href: Href;
  label: string;
  subtitle: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  /** Nome do ícone lucide, para `IconAvatar` escolher a cor da paleta (`getIconColors`). */
  iconName: string;
};

type Section = { title: string; items: MenuItem[] };

const SECTIONS: Section[] = [
  {
    title: 'Planejamento',
    items: [
      {
        href: '/renda',
        label: 'Renda & Entradas',
        subtitle: 'Salário e entradas avulsas',
        icon: Wallet,
        iconName: 'Wallet',
      },
      {
        href: '/mais/assinaturas',
        label: 'Assinaturas',
        subtitle: 'Cobranças recorrentes',
        icon: Repeat,
        iconName: 'Repeat',
      },
      {
        href: '/mais/reservas',
        label: 'Reservas',
        subtitle: 'Dinheiro guardado',
        icon: Layers,
        iconName: 'Layers',
      },
    ],
  },
  {
    title: 'Organização',
    items: [
      {
        href: '/mais/categorias',
        label: 'Categorias',
        subtitle: 'Pré-definidas e personalizadas',
        icon: Tag,
        iconName: 'Tag',
      },
      {
        href: '/mais/estabelecimentos',
        label: 'Estabelecimentos',
        subtitle: 'Onde você costuma comprar',
        icon: Store,
        iconName: 'Store',
      },
    ],
  },
  {
    title: 'Dados',
    items: [
      {
        href: '/mais/backup',
        label: 'Backup',
        subtitle: 'Exportar e restaurar dados',
        icon: UploadCloud,
        iconName: 'UploadCloud',
      },
    ],
  },
];

/** Mais · Main (002-central-de-compras, FR-003): itens organizados em seções. */
export default function MaisScreen() {
  const router = useRouter();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 22 }}>
        <Text
          fontFamily="$heading"
          fontSize={27}
          fontWeight="600"
          letterSpacing={-0.3}
          color="$text"
        >
          Mais
        </Text>

        {SECTIONS.map((section) => (
          <YStack key={section.title} gap="$2">
            <Text
              fontSize={12}
              fontWeight="700"
              letterSpacing={0.9}
              textTransform="uppercase"
              color="$textTertiary"
            >
              {section.title}
            </Text>
            <YStack>
              {section.items.map((item, index) => (
                <XStack
                  key={item.label}
                  paddingVertical={14}
                  borderTopWidth={index === 0 ? 0 : 1}
                  borderColor="$border"
                  alignItems="center"
                  gap="$3"
                  onPress={() => router.push(item.href)}
                >
                  <IconAvatar icon={item.icon} iconName={item.iconName} size={38} />
                  <YStack flex={1}>
                    <Text fontSize={14.5} fontWeight="600" color="$text">
                      {item.label}
                    </Text>
                    <Text fontSize={12} color="$textTertiary">
                      {item.subtitle}
                    </Text>
                  </YStack>
                  <ChevronRight size={16} color="#6C6C6D" />
                </XStack>
              ))}
            </YStack>
          </YStack>
        ))}
      </ScrollView>
    </Screen>
  );
}
