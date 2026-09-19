import { useRouter } from 'expo-router';
import { CreditCard, Plus, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Card, ScrollView, Text, XStack, YStack } from 'tamagui';

import { Money } from '@/components/Money';
import { PrimaryButton } from '@/components/PrimaryButton';
import { PurchaseAvatar } from '@/components/PaymentMethodBadge';
import { Screen } from '@/components/Screen';
import { groupByDay } from '@/domain/purchasesOverview/groupByDay';
import { computeBreakdown } from '@/domain/purchasesOverview/paymentBreakdown';
import type { FormaPagamento } from '@/domain/purchasesOverview/types';
import { useMonthPurchases } from '@/hooks/usePurchasesOverview';
import { colors } from '@/theme/colors';

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

type FilterOption = 'TODOS' | FormaPagamento;

const FILTERS: { value: FilterOption; label: string; Icon?: typeof CreditCard }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'CARTAO', label: 'Cartão', Icon: CreditCard },
  { value: 'PIX', label: 'Pix', Icon: Zap },
];

/**
 * Compras · Main (002-central-de-compras, User Story 1): todas as
 * transações do mês corrente, cartão + Pix, num só lugar (FR-004,
 * FR-010, FR-011, FR-012). Navegação entre meses ainda não existe
 * nesta story — rótulo de mês estático (User Story 2 substitui pelo
 * `MonthNavigator`).
 */
export default function ComprasScreen() {
  const router = useRouter();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const { rows, loading } = useMonthPurchases(year, month);
  const [filter, setFilter] = useState<FilterOption>('TODOS');

  const breakdown = computeBreakdown(rows);
  const filteredRows = rows.filter((row) => filter === 'TODOS' || row.formaPagamento === filter);
  const dayGroups = groupByDay(filteredRows, today);

  const breakdownColor: Record<FormaPagamento, string> = {
    CARTAO: colors.primary,
    PIX: colors.infoDark,
  };
  const breakdownLabel: Record<FormaPagamento, string> = { CARTAO: 'Cartão', PIX: 'Pix' };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
        <Text
          fontFamily="$heading"
          fontSize={27}
          fontWeight="600"
          letterSpacing={-0.3}
          color="$text"
        >
          Compras
        </Text>

        <Text
          fontFamily="$heading"
          fontSize={18}
          fontWeight="600"
          color="$text"
          textAlign="center"
        >
          {MONTH_NAMES[month - 1]} · {year}
        </Text>

        <Card backgroundColor="$surface" borderColor="$border" borderWidth={1} borderRadius="$lg" padding={20} gap="$3">
          <YStack gap="$1">
            <Text fontSize={13} color="$textSecondary" fontWeight="500">
              Total gasto em {MONTH_NAMES[month - 1].toLowerCase()}
            </Text>
            <Money cents={breakdown.total} fontFamily="$heading" fontSize={30} fontWeight="600" color="$text" />
          </YStack>

          {breakdown.porFormaPagamento.length > 0 && (
            <>
              <XStack height={8} borderRadius={999} overflow="hidden" backgroundColor="$border">
                {breakdown.porFormaPagamento.map((entry) => (
                  <XStack
                    key={entry.formaPagamento}
                    flex={entry.total}
                    backgroundColor={breakdownColor[entry.formaPagamento]}
                  />
                ))}
              </XStack>
              <XStack gap="$4" flexWrap="wrap">
                {breakdown.porFormaPagamento.map((entry) => (
                  <XStack key={entry.formaPagamento} alignItems="center" gap="$2">
                    <XStack
                      width={8}
                      height={8}
                      borderRadius={4}
                      backgroundColor={breakdownColor[entry.formaPagamento]}
                    />
                    <Text fontSize={12} color="$textSecondary">
                      {breakdownLabel[entry.formaPagamento]}
                    </Text>
                    <Money cents={entry.total} fontSize={12} fontWeight="700" color="$text" />
                  </XStack>
                ))}
              </XStack>
            </>
          )}
        </Card>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack gap="$2">
            {FILTERS.map(({ value, label, Icon }) => {
              const active = filter === value;
              return (
                <XStack
                  key={value}
                  alignItems="center"
                  gap="$2"
                  paddingVertical={8}
                  paddingHorizontal={14}
                  borderRadius={999}
                  borderWidth={1}
                  borderColor={active ? '$primaryLight' : '$border'}
                  backgroundColor={active ? '$primaryLight' : '$surface'}
                  onPress={() => setFilter(value)}
                >
                  {Icon && <Icon size={14} color={active ? colors.primaryDark : colors.textSecondary} />}
                  <Text
                    fontSize={12.5}
                    fontWeight="600"
                    color={active ? '$primaryDark' : '$textSecondary'}
                  >
                    {label}
                  </Text>
                </XStack>
              );
            })}
          </XStack>
        </ScrollView>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 12 }} />
        ) : dayGroups.length === 0 ? (
          <Text fontSize={13} color="$textSecondary" marginTop="$2">
            Nenhuma compra registrada neste mês.
          </Text>
        ) : (
          dayGroups.map((group) => (
            <YStack key={group.label} gap="$2">
              <Text
                fontSize={11.5}
                fontWeight="700"
                letterSpacing={0.5}
                textTransform="uppercase"
                color="$textTertiary"
              >
                {group.label}
              </Text>
              <YStack>
                {group.rows.map((row, index) => (
                  <XStack
                    key={row.parcelaId}
                    paddingVertical={13}
                    borderTopWidth={index === 0 ? 0 : 1}
                    borderColor="$border"
                    alignItems="center"
                    gap="$3"
                    onPress={() => router.push(`/compra/${row.compraId}`)}
                  >
                    <PurchaseAvatar categoria={row.categoria} formaPagamento={row.formaPagamento} />
                    <YStack flex={1}>
                      <Text fontSize={14} fontWeight="600" color="$text">
                        {row.descricao}
                      </Text>
                      <Text fontSize={12} color="$textTertiary">
                        {row.categoria?.nome ?? 'Sem categoria'}
                        {row.formaPagamento === 'CARTAO' ? ` · ${row.nomeCartao}` : ' · Pix'}
                      </Text>
                    </YStack>
                    <YStack alignItems="flex-end" gap="$1">
                      <Money cents={row.valor} fontSize={14} fontWeight="600" color="$text" />
                      {row.parcela && (
                        <XStack
                          borderRadius={999}
                          borderWidth={1}
                          borderColor="$border"
                          backgroundColor="$bg"
                          paddingHorizontal={7}
                          paddingVertical={2}
                        >
                          <Text fontSize={10.5} fontWeight="700" color="$textTertiary">
                            {row.parcela.atual}/{row.parcela.total}
                          </Text>
                        </XStack>
                      )}
                    </YStack>
                  </XStack>
                ))}
              </YStack>
            </YStack>
          ))
        )}
      </ScrollView>

      <PrimaryButton
        onPress={() => router.push('/nova-compra')}
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
