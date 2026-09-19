import { useRouter } from 'expo-router';
import * as LucideIcons from 'lucide-react-native';
import { Shapes } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { ScrollView, Text, XStack, YStack } from 'tamagui';

import { IconAvatar } from '@/components/IconAvatar';
import { Screen } from '@/components/Screen';
import { type Category, listCategories } from '@/repositories/categoriesRepository';

type IconProps = { size?: number; color?: string };
const icons = LucideIcons as unknown as Record<string, ComponentType<IconProps>>;

export default function NovaCompraCategoriaScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCategories().then((rows) => {
      setCategories(rows);
      setLoading(false);
    });
  }, []);

  const handleSelect = (category: Category) => {
    router.dismissTo({
      pathname: '/cartoes/nova-compra',
      params: { categoriaId: category.id, categoriaNome: category.nome },
    });
  };

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <YStack padding={20} paddingBottom={0}>
        <Text fontFamily="$heading" fontSize={18} fontWeight="600" color="$text">
          Escolha uma categoria
        </Text>
      </YStack>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          categories.map((category, index) => {
            const Icon = icons[category.icone] ?? Shapes;
            return (
              <XStack
                key={category.id}
                paddingVertical={14}
                borderTopWidth={index === 0 ? 0 : 1}
                borderColor="$border"
                alignItems="center"
                gap="$3"
                onPress={() => handleSelect(category)}
              >
                <IconAvatar icon={Icon} iconName={category.icone} size={36} />
                <Text fontSize={15} fontWeight="600" color="$text">
                  {category.nome}
                </Text>
              </XStack>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
