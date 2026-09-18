import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as LucideIcons from 'lucide-react-native';
import { ChevronLeft, Shapes } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { AppInput } from '@/components/AppInput';
import { Screen } from '@/components/Screen';
import { type Category, listCategories } from '@/repositories/categoriesRepository';
import {
  getPurchase,
  listTagsForCompra,
  setPurchaseTags,
  updatePurchase,
} from '@/repositories/purchasesRepository';

type IconProps = { size?: number; color?: string };
const icons = LucideIcons as unknown as Record<string, ComponentType<IconProps>>;

/**
 * T079: edição de descrição, categoria, comentário e tags de uma
 * transação já existente — inclusive uma importada via CSV (FR-007).
 * Nunca toca em valor/parcelamento (ver `updatePurchase`).
 */
export default function EditarTransacaoScreen() {
  const router = useRouter();
  const { compraId } = useLocalSearchParams<{ compraId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [descricao, setDescricao] = useState('');
  const [comentario, setComentario] = useState('');
  const [categoriaId, setCategoriaId] = useState<string | undefined>(undefined);
  const [tagsText, setTagsText] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!compraId) return;
      (async () => {
        setLoading(true);
        const [purchase, tagNomes, categoryList] = await Promise.all([
          getPurchase(compraId),
          listTagsForCompra(compraId),
          listCategories(),
        ]);
        setCategories(categoryList);
        if (purchase) {
          setDescricao(purchase.descricao);
          setComentario(purchase.comentario ?? '');
          setCategoriaId(purchase.categoriaId ?? undefined);
        }
        setTagsText(tagNomes.join(', '));
        setLoading(false);
      })();
    }, [compraId]),
  );

  const handleSave = async () => {
    if (!compraId) return;
    setSaving(true);
    const tagNomes = tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    await updatePurchase(compraId, {
      descricao,
      categoriaId: categoriaId ?? null,
      comentario: comentario || null,
    });
    await setPurchaseTags(compraId, tagNomes);
    setSaving(false);
    router.back();
  };

  if (loading) {
    return (
      <Screen>
        <YStack flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator />
        </YStack>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
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
          Editar transação
        </Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Descrição
          </Text>
          <AppInput value={descricao} onChangeText={setDescricao} />
        </YStack>

        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Categoria
          </Text>
          <XStack flexWrap="wrap" gap="$2">
            {categories.map((category) => {
              const Icon = icons[category.icone] ?? Shapes;
              const selected = categoriaId === category.id;
              return (
                <Button
                  key={category.id}
                  onPress={() => setCategoriaId(selected ? undefined : category.id)}
                  size="$3"
                  backgroundColor={selected ? '$primary' : '$surface'}
                  color={selected ? 'white' : '$text'}
                  borderColor="$border"
                  borderWidth={1}
                  icon={<Icon size={16} color={selected ? 'white' : '#1C1C1E'} />}
                >
                  {category.nome}
                </Button>
              );
            })}
          </XStack>
        </YStack>

        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Tags (separadas por vírgula)
          </Text>
          <AppInput
            value={tagsText}
            onChangeText={setTagsText}
            placeholder="Ex.: Trabalho, Presente"
          />
        </YStack>

        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Comentário
          </Text>
          <AppInput value={comentario} onChangeText={setComentario} placeholder="Opcional" />
        </YStack>

        <Button
          onPress={handleSave}
          disabled={saving}
          backgroundColor="$primary"
          color="white"
          fontWeight="700"
          borderRadius={999}
        >
          Salvar alterações
        </Button>
      </ScrollView>
    </Screen>
  );
}
