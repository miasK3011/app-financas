import { useFocusEffect, useRouter } from 'expo-router';
import * as LucideIcons from 'lucide-react-native';
import { ChevronLeft, Shapes } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { AppInput } from '@/components/AppInput';
import { Money } from '@/components/Money';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import type { PeriodKind } from '@/domain/statistics/types';
import { useStatistics } from '@/hooks/useStatistics';
import { type Category, listCategories } from '@/repositories/categoriesRepository';
import { getIdealGoalPercent, setIdealGoalPercent } from '@/repositories/idealGoalRepository';

type IconProps = { size?: number; color?: string };
const icons = LucideIcons as unknown as Record<string, ComponentType<IconProps>>;

const PERIOD_LABELS: Record<PeriodKind, string> = {
  DIARIO: 'Diário',
  SEMANAL: 'Semanal',
  MENSAL: 'Mensal',
  ANUAL: 'Anual',
};

/** T098/T099: seletor de período, total + comparação, categoria, maiores gastos, meta ideal. */
export default function EstatisticasScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodKind>('MENSAL');
  const { stats, loading, refresh } = useStatistics(period);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  useFocusEffect(
    useCallback(() => {
      listCategories().then(setCategories);
    }, []),
  );

  const categoryById = new Map(categories.map((category) => [category.id, category]));

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
        <XStack gap="$2">
          {(Object.keys(PERIOD_LABELS) as PeriodKind[]).map((kind) => (
            <Button
              key={kind}
              flex={1}
              size="$3"
              onPress={() => setPeriod(kind)}
              backgroundColor={period === kind ? '$primary' : '$surface'}
              color={period === kind ? 'white' : '$text'}
              borderColor="$border"
              borderWidth={1}
              fontWeight="700"
            >
              {PERIOD_LABELS[kind]}
            </Button>
          ))}
        </XStack>

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
                Total gasto no período
              </Text>
              <Money cents={stats.totalSpent} fontSize={32} fontWeight="600" color="$text" />
              {stats.comparison ? (
                <Text
                  fontSize={13}
                  color={stats.comparison.percent <= 0 ? '$success' : '$error'}
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

            <YStack gap="$2">
              <Text fontSize={15} fontWeight="600" color="$text">
                Gasto por categoria
              </Text>
              {stats.spendingByCategory.length === 0 ? (
                <Text fontSize={13} color="$textSecondary">
                  Nenhum gasto neste período.
                </Text>
              ) : (
                stats.spendingByCategory
                  .sort((a, b) => b.total - a.total)
                  .map((entry, index) => {
                    const category = entry.categoriaId
                      ? categoryById.get(entry.categoriaId)
                      : undefined;
                    const Icon = category ? (icons[category.icone] ?? Shapes) : Shapes;
                    return (
                      <XStack
                        key={entry.categoriaId ?? 'sem-categoria'}
                        paddingVertical={10}
                        borderTopWidth={index === 0 ? 0 : 1}
                        borderColor="$border"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <XStack alignItems="center" gap="$2">
                          <Icon size={18} color="#1C1C1E" />
                          <Text fontSize={14} color="$text">
                            {category?.nome ?? 'Sem categoria'}
                          </Text>
                        </XStack>
                        <Money cents={entry.total} fontSize={14} fontWeight="600" color="$text" />
                      </XStack>
                    );
                  })
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
                      cents={item.valorResponsabilidade}
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
