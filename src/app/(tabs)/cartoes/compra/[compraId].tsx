import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as LucideIcons from 'lucide-react-native';
import { Shapes, X } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { AppInput } from '@/components/AppInput';
import { FormCard } from '@/components/FormCard';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { TagInput } from '@/components/TagInput';
import { formatBRL } from '@/domain/shared/money';
import {
  type CashEntry,
  listCashEntriesLinkedToCompra,
  unlinkCashEntryFromCompra,
} from '@/repositories/cashEntriesRepository';
import { type Category, listCategories } from '@/repositories/categoriesRepository';
import { type Establishment, listEstablishments } from '@/repositories/establishmentsRepository';
import {
  getPurchase,
  listTagsForCompra,
  setPurchaseTags,
  updatePurchase,
} from '@/repositories/purchasesRepository';

type IconProps = { size?: number; color?: string };
const icons = LucideIcons as unknown as Record<string, ComponentType<IconProps>>;

/**
 * T079/NovaCompraDivisaoManual.dc.html + NovaCompraDivisaoVinculada.dc.html
 * ("Editar Compra" nos dois estados de divisão): edição de descrição,
 * categoria, comentário e tags de uma transação já existente —
 * inclusive uma importada via CSV (FR-007). Valor/data são somente
 * leitura aqui: `updatePurchase` nunca toca em `Parcela.valor` (não há
 * recálculo de parcelamento implementado) — ver comentário em
 * `purchasesRepository.updatePurchase`.
 */
export default function EditarTransacaoScreen() {
  const router = useRouter();
  const { compraId } = useLocalSearchParams<{ compraId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [descricao, setDescricao] = useState('');
  const [comentario, setComentario] = useState('');
  const [categoriaId, setCategoriaId] = useState<string | undefined>(undefined);
  const [estabelecimentoId, setEstabelecimentoId] = useState<string | undefined>(undefined);
  const [originalEstabelecimentoId, setOriginalEstabelecimentoId] = useState<string | undefined>(
    undefined,
  );
  const [tags, setTags] = useState<string[]>([]);
  const [valorTotalOriginal, setValorTotalOriginal] = useState(0);
  const [dataCompra, setDataCompra] = useState<Date>();
  const [valorResponsabilidade, setValorResponsabilidade] = useState<number | null>(null);
  const [linkedEntries, setLinkedEntries] = useState<CashEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!compraId) return;
      (async () => {
        setLoading(true);
        const [purchase, tagNomes, categoryList, entries, establishmentList] = await Promise.all([
          getPurchase(compraId),
          listTagsForCompra(compraId),
          listCategories(),
          listCashEntriesLinkedToCompra(compraId),
          listEstablishments(),
        ]);
        setCategories(categoryList);
        setLinkedEntries(entries);
        setEstablishments(establishmentList);
        if (purchase) {
          setDescricao(purchase.descricao);
          setComentario(purchase.comentario ?? '');
          setCategoriaId(purchase.categoriaId ?? undefined);
          setEstabelecimentoId(purchase.estabelecimentoId ?? undefined);
          setOriginalEstabelecimentoId(purchase.estabelecimentoId ?? undefined);
          setValorTotalOriginal(purchase.valorTotalOriginal);
          setDataCompra(purchase.dataCompra);
          setValorResponsabilidade(purchase.valorResponsabilidade);
        }
        setTags(tagNomes);
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

    await updatePurchase(compraId, {
      descricao,
      categoriaId: categoriaId ?? null,
      comentario: comentario || null,
      // Só inclui `estabelecimentoId` quando o usuário de fato mexeu
      // nele — sempre marca `estabelecimentoManual = true`
      // (`updatePurchase`), então nunca deve ser enviado "por acaso"
      // num save que só mudou outro campo, ou perderíamos o matching
      // automático desta Compra para sempre (FR-034).
      ...(estabelecimentoId !== originalEstabelecimentoId
        ? { estabelecimentoId: estabelecimentoId ?? null }
        : {}),
    });
    await setPurchaseTags(compraId, tags);
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
      <XStack alignItems="center" justifyContent="space-between" padding={20} paddingBottom={0}>
        <XStack alignItems="center" gap="$3">
          <Button
            onPress={() => router.back()}
            circular
            size="$3"
            backgroundColor="$surface"
            borderColor="$border"
            borderWidth={1}
            icon={<X size={18} />}
          />
          <Text fontFamily="$heading" fontSize={18} fontWeight="600" color="$text">
            Editar compra
          </Text>
        </XStack>
        <Button
          onPress={handleSave}
          disabled={saving}
          chromeless
          color="$primary"
          fontWeight="700"
          fontSize={15}
        >
          Salvar
        </Button>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
        <FormCard title="Detalhes">
          <YStack gap="$2">
            <Text fontSize={13} color="$textSecondary">
              Descrição
            </Text>
            <AppInput value={descricao} onChangeText={setDescricao} />
          </YStack>

          <XStack gap="$3">
            <YStack flex={1} gap="$2">
              <Text fontSize={13} color="$textSecondary">
                Valor
              </Text>
              <AppInput
                value={formatBRL(valorTotalOriginal)}
                pointerEvents="none"
                opacity={0.7}
              />
            </YStack>
            <YStack flex={1} gap="$2">
              <Text fontSize={13} color="$textSecondary">
                Data
              </Text>
              <AppInput
                value={
                  dataCompra
                    ? `${dataCompra.getDate()}/${dataCompra.getMonth() + 1}/${dataCompra.getFullYear()}`
                    : ''
                }
                pointerEvents="none"
                opacity={0.7}
              />
            </YStack>
          </XStack>
        </FormCard>

        <FormCard title="Divisão de responsabilidade">
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
        </FormCard>

        <FormCard title="Organização">
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
              Estabelecimento
            </Text>
            <XStack flexWrap="wrap" gap="$2">
              <Button
                onPress={() => setEstabelecimentoId(undefined)}
                size="$3"
                backgroundColor={estabelecimentoId === undefined ? '$primary' : '$surface'}
                color={estabelecimentoId === undefined ? 'white' : '$text'}
                borderColor="$border"
                borderWidth={1}
              >
                Nenhum
              </Button>
              {establishments.map((establishment) => {
                const selected = estabelecimentoId === establishment.id;
                return (
                  <Button
                    key={establishment.id}
                    onPress={() => setEstabelecimentoId(establishment.id)}
                    size="$3"
                    backgroundColor={selected ? '$primary' : '$surface'}
                    color={selected ? 'white' : '$text'}
                    borderColor="$border"
                    borderWidth={1}
                  >
                    {establishment.nomeExibicao}
                  </Button>
                );
              })}
            </XStack>
          </YStack>

          <YStack gap="$2">
            <Text fontSize={13} color="$textSecondary">
              Tags
            </Text>
            <TagInput value={tags} onChange={setTags} />
          </YStack>
        </FormCard>

        <FormCard title="Comentário">
          <AppInput value={comentario} onChangeText={setComentario} placeholder="Opcional" />
        </FormCard>
      </ScrollView>
    </Screen>
  );
}
