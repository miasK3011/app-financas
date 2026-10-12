import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { AppInput } from '@/components/AppInput';
import { DonutChart } from '@/components/DonutChart';
import { Money } from '@/components/Money';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { amountOf } from '@/domain/statistics/amountOf';
import {
  type CategoryShare,
  formatSharePct,
  toCategoryShare,
} from '@/domain/statistics/categoryShare';
import type { PeriodKind, SpendingBasis } from '@/domain/statistics/types';
import { useStatistics } from '@/hooks/useStatistics';
import { type Category, listCategories } from '@/repositories/categoriesRepository';
import { getIdealGoalPercent, setIdealGoalPercent } from '@/repositories/idealGoalRepository';
import { statisticsPrefs } from '@/state/statisticsPrefs';
import { chartColorForRank, colors } from '@/theme/colors';

const PERIOD_LABELS: Record<PeriodKind, string> = {
  DIARIO: 'Diário',
  SEMANAL: 'Semanal',
  MENSAL: 'Mensal',
  ANUAL: 'Anual',
};

const BASIS_OPTIONS: { value: SpendingBasis; label: string }[] = [
  { value: 'minha', label: 'Meu gasto' },
  { value: 'global', label: 'Global' },
];

/** T098/T099: seletor de período, total + comparação, categoria, maiores gastos, meta ideal. */
export default function EstatisticasScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodKind>('MENSAL');
  const [basis, setBasisState] = useState<SpendingBasis>(statisticsPrefs.getBasis);
  const { stats, loading, refresh } = useStatistics(period, basis);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  useFocusEffect(
    useCallback(() => {
      listCategories().then(setCategories);
    }, []),
  );

  const setBasis = (value: SpendingBasis) => {
    statisticsPrefs.setBasis(value);
    setBasisState(value);
  };

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const categoryShares = stats ? toCategoryShare(stats.spendingByCategory) : [];
  const categoryName = (share: CategoryShare) =>
    share.isOutras
      ? 'Outras'
      : ((share.categoriaId && categoryById.get(share.categoriaId)?.nome) ?? 'Sem categoria');
  // O detalhamento reabre o mesmo período e a mesma base (FR-016).
  const openCategoryDetail = () =>
    router.push({
      pathname: '/inicio/estatisticas-categorias',
      params: { kind: period, anchor: new Date().toISOString(), basis },
    });

  const handleSaveGoal = async () => {
    const percent = Number(goalInput.replace(',', '.'));
    if (!Number.isNaN(percent) && percent > 0) {
      await setIdealGoalPercent(percent / 100);
      await refresh();
    }
    setEditingGoal(false);
    setGoalInput('');
  };

  const startEditingGoal = async () => {
    const current = await getIdealGoalPercent();
    setGoalInput(current !== null ? String(Math.round(current * 100)) : '');
    setEditingGoal(true);
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
        <Text fontFamily="$heading" fontSize={18} fontWeight="600" color="$text">
          Estatísticas
        </Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 22 }}>
        <SegmentedControl
          options={(Object.keys(PERIOD_LABELS) as PeriodKind[]).map((kind) => ({
            value: kind,
            label: PERIOD_LABELS[kind],
          }))}
          value={period}
          onChange={setPeriod}
        />

        <SegmentedControl options={BASIS_OPTIONS} value={basis} onChange={setBasis} />

        {loading || !stats ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <>
            <YStack
              backgroundColor="$surface"
              borderColor="$border"
              borderWidth={1}
              borderRadius="$lg"
              padding={22}
              gap="$1"
            >
              <Text fontSize={13} color="$textSecondary">
                {stats.basis === 'global'
                  ? 'Total gasto no período (global)'
                  : 'Total gasto no período'}
              </Text>
              <Money cents={stats.totalSpent} fontSize={32} fontWeight="600" color="$text" />
              {stats.basis === 'global' && stats.totalMinhaParte !== stats.totalSpent ? (
                <XStack gap="$1" alignItems="center">
                  <Text fontSize={13} color="$textSecondary">
                    Sua parte:
                  </Text>
                  <Money
                    cents={stats.totalMinhaParte}
                    fontSize={13}
                    fontWeight="700"
                    color="$textSecondary"
                  />
                </XStack>
              ) : null}
              {stats.comparison ? (
                <Text
                  fontSize={13}
                  color={stats.comparison.percent <= 0 ? '$successDark' : '$error'}
                  marginTop="$1"
                >
                  {stats.comparison.percent > 0 ? '+' : ''}
                  {Math.round(stats.comparison.percent * 100)}% que o período anterior
                </Text>
              ) : (
                <Text fontSize={13} color="$textTertiary" marginTop="$1">
                  Sem dado do período anterior para comparar
                </Text>
              )}
            </YStack>

            <YStack gap="$2">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize={15} fontWeight="600" color="$text">
                  Meta de consumo ideal
                </Text>
                <Button
                  onPress={startEditingGoal}
                  size="$2"
                  chromeless
                  color="$primary"
                  fontWeight="600"
                >
                  {stats.idealSpend ? 'Editar' : 'Configurar'}
                </Button>
              </XStack>

              {editingGoal ? (
                <XStack gap="$2" alignItems="center">
                  <AppInput
                    flex={1}
                    value={goalInput}
                    onChangeText={setGoalInput}
                    placeholder="Ex.: 70 (% da renda)"
                    keyboardType="decimal-pad"
                    autoFocus
                  />
                  <PrimaryButton onPress={handleSaveGoal} color="white" fontWeight="700">
                    Salvar
                  </PrimaryButton>
                </XStack>
              ) : stats.idealSpend ? (
                <YStack gap="$1">
                  <Text fontSize={13} color="$textSecondary">
                    {Math.round(stats.idealSpend.used * 100)}% da meta ideal ({' '}
                    <Money
                      cents={stats.idealSpend.goalAmount}
                      fontSize={13}
                      color="$textSecondary"
                    />
                    )
                  </Text>
                </YStack>
              ) : (
                <Text fontSize={13} color="$textTertiary">
                  Configure sua renda e uma meta para ver esta comparação.
                </Text>
              )}
            </YStack>

            <YStack gap="$3">
              <Text fontSize={15} fontWeight="600" color="$text">
                Gasto por categoria
              </Text>
              {categoryShares.length === 0 ? (
                <Text fontSize={13} color="$textSecondary">
                  Nenhum gasto neste período.
                </Text>
              ) : (
                <YStack gap="$1.5">
                  {/* FR-015/FR-016 (003, issue #24): rosca + legenda; toque abre o detalhamento. */}
                  <XStack alignItems="center" gap="$4">
                    <DonutChart
                      size={140}
                      thickness={20}
                      segments={categoryShares.map((share) => ({
                        key: share.key,
                        value: share.total,
                        color: chartColorForRank(share.rank, share.isOutras),
                      }))}
                      centerLabel={
                        <YStack alignItems="center">
                          <Money
                            cents={stats.totalSpent}
                            fontFamily="$heading"
                            fontSize={14}
                            fontWeight="600"
                            color="$text"
                          />
                          <Text fontSize={11.5} color="$textTertiary">
                            no período
                          </Text>
                        </YStack>
                      }
                      onPress={openCategoryDetail}
                      accessibilityLabel="Abrir detalhamento do gasto por categoria"
                    />
                    <YStack flex={1} gap={9}>
                      {categoryShares.map((share) => (
                        <XStack key={share.key} alignItems="center" gap="$2">
                          <XStack
                            width={10}
                            height={10}
                            borderRadius={3}
                            backgroundColor={chartColorForRank(share.rank, share.isOutras)}
                          />
                          <Text flex={1} fontSize={13} color="$text" numberOfLines={1}>
                            {categoryName(share)}
                          </Text>
                          <Text fontSize={13} fontWeight="600" color="$textSecondary">
                            {formatSharePct(share.pct)}
                          </Text>
                        </XStack>
                      ))}
                    </YStack>
                  </XStack>
                  <XStack
                    alignSelf="flex-end"
                    alignItems="center"
                    gap="$1"
                    padding="$1"
                    pressStyle={{ opacity: 0.55, scale: 0.96 }}
                    accessibilityRole="button"
                    onPress={openCategoryDetail}
                  >
                    <Text fontSize={13} fontWeight="600" color="$primary">
                      Ver detalhes
                    </Text>
                    <ChevronRight size={15} color={colors.primary} />
                  </XStack>
                </YStack>
              )}
            </YStack>

            <YStack gap="$2">
              <Text fontSize={15} fontWeight="600" color="$text">
                Maiores gastos
              </Text>
              {stats.topExpenses.length === 0 ? (
                <Text fontSize={13} color="$textSecondary">
                  Nenhum gasto neste período.
                </Text>
              ) : (
                stats.topExpenses.map((item, index) => (
                  <XStack
                    key={item.parcelaId}
                    paddingVertical={10}
                    borderTopWidth={index === 0 ? 0 : 1}
                    borderColor="$border"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Text fontSize={14} color="$text" flex={1} numberOfLines={1}>
                      {item.compra.descricao}
                    </Text>
                    <Money
                      cents={amountOf(item, stats.basis)}
                      fontSize={14}
                      fontWeight="600"
                      color="$text"
                    />
                  </XStack>
                ))
              )}
            </YStack>

            <YStack backgroundColor="$infoBg" borderRadius="$md" padding={16} gap="$1">
              <Text fontSize={13} color="$infoDark">
                Assinaturas representam{' '}
                <Text fontWeight="700">{Math.round(stats.subscriptionsShare.percent * 100)}%</Text>{' '}
                do gasto deste período
              </Text>
            </YStack>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
