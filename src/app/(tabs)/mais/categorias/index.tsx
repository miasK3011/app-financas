import { useFocusEffect, useRouter } from 'expo-router';
import * as LucideIcons from 'lucide-react-native';
import { ChevronLeft, Plus, Shapes, Trash2 } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { type Category, deleteCategory, listCategories } from '@/repositories/categoriesRepository';

type IconProps = { size?: number; color?: string };
const icons = LucideIcons as unknown as Record<string, ComponentType<IconProps>>;

export default function CategoriasScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setCategories(await listCategories());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleDelete = (category: Category) => {
    Alert.alert(
      'Excluir categoria',
      `Compras que usam "${category.nome}" passam a exibir o ícone genérico "Outros".`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deleteCategory(category.id);
            await refresh();
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <XStack alignItems="center" gap="$3" padding={20} paddingBottom={0}>
        <Button
          onPress={() => router.back()}
          circular
          size="$3"
          backgroundColor="$surface"
          borderColor="$border"
          borderWidth={1}
          icon={<ChevronLeft size={18} />}
        />
        <Text fontFamily="$heading" fontSize={18} fontWeight="600" color="$text">
          Categorias
        </Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <YStack>
            {categories.map((category, index) => {
              const Icon = icons[category.icone] ?? Shapes;
              return (
                <XStack
                  key={category.id}
                  paddingVertical={14}
                  borderTopWidth={index === 0 ? 0 : 1}
                  borderColor="$border"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <XStack alignItems="center" gap="$3">
                    <Icon size={20} color="#1C1C1E" />
                    <Text fontSize={15} fontWeight="600" color="$text">
                      {category.nome}
                    </Text>
                    {category.predefinida && (
                      <Text fontSize={11} color="$textTertiary">
                        (pré-definida)
                      </Text>
                    )}
                  </XStack>
                  {!category.predefinida && (
                    <Button
                      onPress={() => handleDelete(category)}
                      size="$2"
                      circular
                      chromeless
                      icon={<Trash2 size={16} color="#C74A3C" />}
                    />
                  )}
                </XStack>
              );
            })}
          </YStack>
        )}
      </ScrollView>

      <PrimaryButton
        onPress={() => router.push('/mais/categorias/nova')}
        position="absolute"
        bottom={24}
        right={20}
        width={56}
        height={56}
        borderRadius={28}
        icon={<Plus color="white" size={24} />}
      />
    </Screen>
  );
}
