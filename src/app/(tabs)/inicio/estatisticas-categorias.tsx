import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as LucideIcons from 'lucide-react-native';
import { ChevronLeft, Shapes } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { DonutChart } from '@/components/DonutChart';
import { IconAvatar } from '@/components/IconAvatar';
import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import {
  type CategoryShare,
  formatSharePct,
  toCategoryShare,
  toCategoryShareFull,
} from '@/domain/statistics/categoryShare';
import { periodLabel } from '@/domain/statistics/periodLabel';
import type { PeriodKind, SpendingBasis } from '@/domain/statistics/types';
import { useStatistics } from '@/hooks/useStatistics';
import { type Category, listCategories } from '@/repositories/categoriesRepository';
import { chartColorForRank } from '@/theme/colors';

type IconProps = { size?: number; color?: string };
const icons = LucideIcons as unknown as Record<string, ComponentType<IconProps>>;

const TOP_N = 5;

/**
 * Detalhamento do gasto por categoria (feature 003, FR-016, issue #24):
 * rosca grande + todas as categorias com valor, % e barra, no mesmo
 * período e base (Meu gasto/Global) de Estatísticas. Tocar numa linha
 * destaca o segmento dela; as que formam "Outras" vêm por último.
 */
export default function EstatisticasCategoriasScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string; anchor?: string; basis?: string }>();
  const kind = (params.kind ?? 'MENSAL') as PeriodKind;
  const basis: SpendingBasis = params.basis === 'global' ? 'global' : 'minha';
  const anchor = useMemo(
    () => (params.anchor ? new Date(params.anchor) : new Date()),
    [params.anchor],
  );

  const { stats, loading } = useStatistics(kind, basis, anchor);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      listCategories().then(setCategories);
    }, []),
  );

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const chartShares = stats ? toCategoryShare(stats.spendingByCategory, TOP_N) : [];
  const allShares = stats ? toCategoryShareFull(stats.spendingByCategory) : [];
  const mainShares = allShares.slice(0, TOP_N);
  const otherShares = allShares.slice(TOP_N);

  const nameOf = (share: CategoryShare) =>
    share.isOutras
      ? 'Outras'
      : ((share.categoriaId && categoryById.get(share.categoriaId)?.nome) ?? 'Sem categoria');

  const selectedShare = selected ? allShares.find((share) => share.key === selected) : undefined;
  // Uma categoria agrupada em "Outras" destaca o segmento "Outras".
  const highlightKey = selectedShare
    ? selectedShare.rank >= TOP_N
      ? 'outras'
      : selectedShare.key
    : null;

  const renderRow = (share: CategoryShare, index: number) => {
    const category = share.categoriaId ? categoryById.get(share.categoriaId) : undefined;
    const Icon = category ? (icons[category.icone] ?? Shapes) : Shapes;
    const color = chartColorForRank(share.rank);
    const dimmed = selected !== null && selected !== share.key;

    return (
      <XStack
        key={share.key}
        paddingVertical={12}
        borderTopWidth={index === 0 ? 0 : 1}
        borderColor="$border"
        alignItems="center"
        gap="$3"
        opacity={dimmed ? 0.4 : 1}
        pressStyle={{ opacity: 0.55 }}
        accessibilityRole="button"
        accessibilityState={{ selected: selected === share.key }}
        onPress={() => setSelected((current) => (current === share.key ? null : share.key))}
      >
        <IconAvatar icon={Icon} iconName={category?.icone} size={34} />
        <YStack flex={1} gap="$1.5">
          <XStack justifyContent="space-between" alignItems="baseline" gap="$2">
            <XStack alignItems="center" gap="$1.5" flexShrink={1}>
              <XStack width={8} height={8} borderRadius={2} backgroundColor={color} />
              <Text fontSize={14} fontWeight="600" color="$text" numberOfLines={1} flexShrink={1}>
                {nameOf(share)}
              </Text>
            </XStack>
            <Money cents={share.total} fontSize={14} fontWeight="600" color="$text" />
          </XStack>
          <XStack alignItems="center" gap="$2.5">
            <XStack
              flex={1}
              height={6}
              borderRadius={999}
              backgroundColor="$border"
              overflow="hidden"
            >
              <XStack
                width={`${Math.max(share.pct, 1)}%`}
                height="100%"
                borderRadius={999}
                backgroundColor={color}
              />
            </XStack>
            <Text
              fontSize={12}
              fontWeight="600"
              color="$textTertiary"
              minWidth={40}
              textAlign="right"
            >
              {formatSharePct(share.pct)}
            </Text>
          </XStack>
        </YStack>
      </XStack>
    );
  };

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
        <YStack>
          <Text fontFamily="$heading" fontSize={18} fontWeight="600" color="$text">
            Gasto por categoria
          </Text>
          {stats && (
            <Text fontSize={12.5} color="$textTertiary">
              {periodLabel(kind, stats.period)} · {basis === 'global' ? 'Global' : 'Meu gasto'}
            </Text>
          )}
        </YStack>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        {loading && !stats ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : !stats || chartShares.length === 0 ? (
          <Text fontSize={13} color="$textSecondary">
            Nenhum gasto neste período.
          </Text>
        ) : (
          <>
            <YStack alignItems="center" gap="$1.5" paddingTop="$1">
              <DonutChart
                size={220}
                thickness={30}
                highlightKey={highlightKey}
                segments={chartShares.map((share) => ({
                  key: share.key,
                  value: share.total,
                  color: chartColorForRank(share.rank, share.isOutras),
                }))}
                centerLabel={
                  selectedShare ? (
                    <YStack alignItems="center">
                      <Text fontFamily="$heading" fontSize={19} fontWeight="600" color="$text">
                        {formatSharePct(selectedShare.pct)}
                      </Text>
                      <Text
                        fontSize={11.5}
                        color="$textTertiary"
                        textAlign="center"
                        numberOfLines={1}
                      >
                        {nameOf(selectedShare)}
                      </Text>
                      <Money cents={selectedShare.total} fontSize={11.5} color="$textTertiary" />
                    </YStack>
                  ) : (
                    <YStack alignItems="center">
                      <Money
                        cents={stats.totalSpent}
                        fontFamily="$heading"
                        fontSize={19}
                        fontWeight="600"
                        color="$text"
                      />
                      <Text fontSize={11.5} color="$textTertiary">
                        {basis === 'global' ? 'gasto global' : 'seu gasto'}
                      </Text>
                    </YStack>
                  )
                }
                accessibilityLabel="Gráfico do gasto por categoria"
              />
              <Text fontSize={12} color="$textTertiary" textAlign="center">
                Toque numa categoria para destacá-la
              </Text>
            </YStack>

            <YStack>{mainShares.map(renderRow)}</YStack>

            {otherShares.length > 0 && (
              <YStack gap="$1">
                <Text
                  fontSize={11.5}
                  fontWeight="700"
                  letterSpacing={0.5}
                  textTransform="uppercase"
                  color="$textTertiary"
                >
                  Em Outras
                </Text>
                <YStack>{otherShares.map(renderRow)}</YStack>
              </YStack>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
