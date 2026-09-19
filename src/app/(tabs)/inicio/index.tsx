import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { ScrollView, Text, XStack, YStack } from 'tamagui';

import { Screen } from '@/components/Screen';
import {
  getMonthlySpendingHistory,
  type MonthlySpending,
} from '@/repositories/statisticsRepository';

const MONTH_ABBR = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

const CHART_HEIGHT = 100;

/** T097: gráfico compacto do consumo mensal recente (últimos 6 meses), tocável para abrir Estatísticas. */
export default function InicioScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<MonthlySpending[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getMonthlySpendingHistory(6)
        .then(setHistory)
        .finally(() => setLoading(false));
    }, []),
  );

  const monthsWithSpending = history.filter((entry) => entry.total > 0).length;
  const maxTotal = Math.max(1, ...history.map((entry) => entry.total));

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
          Início
        </Text>

        <YStack
          backgroundColor="$surface"
          borderColor="$border"
          borderWidth={1}
          borderRadius="$lg"
          padding={22}
          gap="$3"
          onPress={() => router.push('/inicio/estatisticas')}
        >
          <Text fontSize={15} fontWeight="600" color="$text">
            Consumo mensal recente
          </Text>

          {loading ? (
            <ActivityIndicator />
          ) : monthsWithSpending < 2 ? (
            <Text fontSize={13} color="$textSecondary">
              Ainda não há histórico suficiente (pelo menos 2 meses com gastos) para o gráfico.
            </Text>
          ) : (
            <XStack alignItems="flex-end" justifyContent="space-between" height={CHART_HEIGHT + 24}>
              {history.map((entry) => (
                <YStack key={`${entry.year}-${entry.month}`} alignItems="center" gap="$1" flex={1}>
                  <YStack
                    width={20}
                    height={Math.max(4, (entry.total / maxTotal) * CHART_HEIGHT)}
                    backgroundColor="$primary"
                    borderRadius={4}
                  />
                  <Text fontSize={11} color="$textTertiary">
                    {MONTH_ABBR[entry.month - 1]}
                  </Text>
                </YStack>
              ))}
            </XStack>
          )}

          <Text fontSize={12} color="$primary" fontWeight="600">
            Ver estatísticas detalhadas →
          </Text>
        </YStack>
      </ScrollView>
    </Screen>
  );
}
