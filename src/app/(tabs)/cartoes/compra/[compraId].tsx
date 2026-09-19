import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as LucideIcons from 'lucide-react-native';
import { ChevronRight, Shapes, X } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { AppInput } from '@/components/AppInput';
import { FormCard } from '@/components/FormCard';
import { IconAvatar } from '@/components/IconAvatar';
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
  const params = useLocalSearchParams<{
    compraId: string;
    categoriaId?: string;
    estabelecimentoId?: string;
  }>();
  const { compraId } = params;
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
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

  // A Divisão de responsabilidade (`divisao-manual`/`divisao-vinculada`,
  // empurradas a partir daqui) grava direto no banco — por isso
  // valorResponsabilidade/linkedEntries precisam recarregar a cada foco
  // (useFocusEffect, não useEffect: ver mesmo comentário em
  // useCards.ts). Descrição/categoria/estabelecimento/tags, porém, só
  // existem localmente até "Salvar" — recarregá-los do banco a cada
  // foco (inclusive ao voltar do picker de Categoria/Estabelecimento,
  // que só devolve via params, nunca grava) apagaria a seleção que o
  // usuário acabou de fazer. Por isso só são inicializados uma vez.
  useFocusEffect(
    useCallback(() => {
      if (!compraId) return;
      (async () => {
        const [purchase, entries] = await Promise.all([
          getPurchase(compraId),
          listCashEntriesLinkedToCompra(compraId),
        ]);
        setLinkedEntries(entries);
        if (purchase) {
          setValorResponsabilidade(purchase.valorResponsabilidade);
        }
        setLoading(false);
      })();
    }, [compraId]),
  );

  useEffect(() => {
    if (!compraId || initialized) return;
    (async () => {
      const [purchase, tagNomes, categoryList, establishmentList] = await Promise.all([
        getPurchase(compraId),
        listTagsForCompra(compraId),
        listCategories(),
        listEstablishments(),
      ]);
      setCategories(categoryList);
      setEstablishments(establishmentList);
      if (purchase) {
        setDescricao(purchase.descricao);
        setComentario(purchase.comentario ?? '');
        setCategoriaId(purchase.categoriaId ?? undefined);
        setEstabelecimentoId(purchase.estabelecimentoId ?? undefined);
        setOriginalEstabelecimentoId(purchase.estabelecimentoId ?? undefined);
        setValorTotalOriginal(purchase.valorTotalOriginal);
        setDataCompra(purchase.dataCompra);
      }
      setTags(tagNomes);
      setInitialized(true);
    })();
  }, [compraId, initialized]);

  // Volta do picker de Categoria/Estabelecimento (`dismissTo` com
  // `returnTo: 'editar-compra'` — ver categoria.tsx/estabelecimento.tsx).
  useEffect(() => {
    if (params.categoriaId !== undefined) setCategoriaId(params.categoriaId);
  }, [params.categoriaId]);
  useEffect(() => {
    if (params.estabelecimentoId !== undefined) setEstabelecimentoId(params.estabelecimentoId);
  }, [params.estabelecimentoId]);

  const selectedCategory = categories.find((category) => category.id === categoriaId);
  const selectedEstablishment = establishments.find(
    (establishment) => establishment.id === estabelecimentoId,
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

  if (loading || !initialized) {
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
            <XStack
              backgroundColor="$bg"
              borderColor="$border"
              borderWidth={1}
              borderRadius="$md"
              paddingVertical={9}
              paddingHorizontal={13}
              alignItems="center"
              justifyContent="space-between"
              gap="$2"
              onPress={() =>
                router.push({
                  pathname: '/cartoes/nova-compra/categoria',
                  params: { categoriaId, returnTo: 'editar-compra', compraId },
                })
              }
            >
              <XStack alignItems="center" gap="$2.5">
                {selectedCategory && (
                  <IconAvatar
                    icon={icons[selectedCategory.icone] ?? Shapes}
                    iconName={selectedCategory.icone}
                    size={30}
                  />
                )}
                <Text fontSize={14.5} fontWeight="600" color="$text">
                  {selectedCategory?.nome ?? 'Nenhuma'}
                </Text>
              </XStack>
              <ChevronRight size={17} color="#6C6C6D" />
            </XStack>
          </YStack>

          <YStack gap="$2">
            <Text fontSize={13} color="$textSecondary">
              Estabelecimento
            </Text>
            <XStack
              backgroundColor="$bg"
              borderColor="$border"
              borderWidth={1}
              borderRadius="$md"
              paddingVertical={9}
              paddingHorizontal={13}
              alignItems="center"
              justifyContent="space-between"
              gap="$2"
              onPress={() =>
                router.push({
                  pathname: '/cartoes/nova-compra/estabelecimento',
                  params: { descricao, returnTo: 'editar-compra', compraId },
                })
              }
            >
              <Text fontSize={14.5} fontWeight="600" color="$text">
                {selectedEstablishment?.nomeExibicao ?? 'Nenhum'}
              </Text>
              <ChevronRight size={17} color="#6C6C6D" />
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
