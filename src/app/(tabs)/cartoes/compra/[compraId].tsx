import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as LucideIcons from 'lucide-react-native';
import { ChevronLeft, Shapes, X } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { AppInput } from '@/components/AppInput';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import {
  type CashEntry,
  listCashEntriesLinkedToCompra,
  unlinkCashEntryFromCompra,
} from '@/repositories/cashEntriesRepository';
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
  const [valorTotalOriginal, setValorTotalOriginal] = useState(0);
  const [valorResponsabilidade, setValorResponsabilidade] = useState<number | null>(null);
  const [linkedEntries, setLinkedEntries] = useState<CashEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!compraId) return;
      (async () => {
        setLoading(true);
        const [purchase, tagNomes, categoryList, entries] = await Promise.all([
          getPurchase(compraId),
          listTagsForCompra(compraId),
          listCategories(),
          listCashEntriesLinkedToCompra(compraId),
        ]);
        setCategories(categoryList);
        setLinkedEntries(entries);
        if (purchase) {
          setDescricao(purchase.descricao);
          setComentario(purchase.comentario ?? '');
          setCategoriaId(purchase.categoriaId ?? undefined);
          setValorTotalOriginal(purchase.valorTotalOriginal);
          setValorResponsabilidade(purchase.valorResponsabilidade);
        }
        setTagsText(tagNomes.join(', '));
        setLoading(false);
      })();
    }, [compraId]),
  );

  const hasLinkedEntries = linkedEntries.length > 0;
  const linkedEntriesTotal = linkedEntries.reduce((sum, entry) => sum + entry.valor, 0);
  const computedResponsibility = Math.max(0, valorTotalOriginal - linkedEntriesTotal);

  const handleUnlink = async (entryId: string) => {
    await unlinkCashEntryFromCompra(entryId);
    setLinkedEntries((current) => current.filter((entry) => entry.id !== entryId));
    const updated = await getPurchase(compraId);
    if (updated) setValorResponsabilidade(updated.valorResponsabilidade);
  };

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

        <YStack
          backgroundColor="$surface"
          borderColor="$border"
          borderWidth={1}
          borderRadius="$lg"
          padding={18}
          gap="$3"
        >
          <Text fontSize={12} fontWeight="700" color="$textTertiary" textTransform="uppercase">
            Divisão de responsabilidade
          </Text>

          {hasLinkedEntries ? (
            <>
              {linkedEntries.map((entry) => (
                <XStack
                  key={entry.id}
                  backgroundColor="$successBg"
                  borderRadius="$md"
                  padding={12}
                  alignItems="center"
                  gap="$3"
                >
                  <YStack flex={1}>
                    <Text fontSize={13.5} fontWeight="700" color="$successDark">
                      {entry.descricao}
                    </Text>
                    <XStack gap="$1" marginTop={2}>
                      <Text fontSize={12} color="$textSecondary">
                        Entrada avulsa ·
                      </Text>
                      <Money cents={entry.valor} fontSize={12} color="$textSecondary" />
                    </XStack>
                  </YStack>
                  <Button
                    onPress={() => handleUnlink(entry.id)}
                    size="$2"
                    circular
                    chromeless
                    icon={<X size={16} />}
                  />
                </XStack>
              ))}

              <YStack gap="$1">
                <Text fontSize={12.5} fontWeight="600" color="$textSecondary">
                  Valor de responsabilidade (calculado)
                </Text>
                <XStack
                  borderColor="$border"
                  borderWidth={1}
                  borderRadius="$md"
                  padding={12}
                  alignItems="baseline"
                  gap="$2"
                  backgroundColor="$border"
                >
                  <Money
                    cents={computedResponsibility}
                    fontFamily="$heading"
                    fontSize={17}
                    fontWeight="600"
                    color="$text"
                  />
                  <Text fontSize={12.5} color="$textTertiary">
                    = <Money cents={valorTotalOriginal} fontSize={12.5} color="$textTertiary" /> −{' '}
                    <Money cents={linkedEntriesTotal} fontSize={12.5} color="$textTertiary" />
                  </Text>
                </XStack>
              </YStack>
            </>
          ) : (
            <>
              <XStack justifyContent="space-between" alignItems="center">
                <YStack>
                  <Text fontSize={12.5} color="$textSecondary">
                    Valor de responsabilidade
                  </Text>
                  <Money
                    cents={valorResponsabilidade ?? valorTotalOriginal}
                    fontFamily="$heading"
                    fontSize={17}
                    fontWeight="600"
                    color="$text"
                  />
                </YStack>
                <Button
                  onPress={() =>
                    router.push(`/cartoes/nova-compra/divisao-manual?compraId=${compraId}`)
                  }
                  size="$2"
                  chromeless
                  color="$primary"
                  fontWeight="600"
                >
                  Editar
                </Button>
              </XStack>

              <Button
                onPress={() =>
                  router.push(`/cartoes/nova-compra/divisao-vinculada?compraId=${compraId}`)
                }
                backgroundColor="$primaryLight"
                borderColor="$primary"
                borderWidth={1.5}
                borderStyle="dashed"
                color="$primaryDark"
                fontWeight="700"
              >
                Vincular entrada avulsa de reembolso
              </Button>
            </>
          )}
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
