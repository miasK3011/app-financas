import { useRouter } from 'expo-router';
import { CreditCard, Plus, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Card, ScrollView, Text, XStack, YStack } from 'tamagui';

import { MonthNavigator } from '@/components/MonthNavigator';
import { Money } from '@/components/Money';
import { PurchaseAvatar } from '@/components/PaymentMethodBadge';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { groupByDay } from '@/domain/purchasesOverview/groupByDay';
import { computeBreakdown } from '@/domain/purchasesOverview/paymentBreakdown';
import type { FormaPagamento, PurchaseListRow } from '@/domain/purchasesOverview/types';
import {
  useForecastInvoices,
  useMonthPurchases,
  useMonthRange,
} from '@/hooks/usePurchasesOverview';
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

const BREAKDOWN_COLOR: Record<FormaPagamento, string> = {
  CARTAO: colors.primary,
  PIX: colors.infoDark,
};
const BREAKDOWN_LABEL: Record<FormaPagamento, string> = { CARTAO: 'Cartão', PIX: 'Pix' };

type MonthKind = 'atual' | 'passado' | 'futuro-previsto';

/** Índice absoluto do mês (para comparar dois `{ year, month }` com uma subtração). */
function monthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const index = monthIndex(year, month) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** Uma linha de transação — mesmo shape (`PurchaseListRow`) na visão por dia e por fatura. */
function PurchaseRow({ row, isFirst }: { row: PurchaseListRow; isFirst: boolean }) {
  const router = useRouter();
  return (
    <XStack
      paddingVertical={13}
      borderTopWidth={isFirst ? 0 : 1}
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
  );
}

/**
 * Compras · Main (002-central-de-compras): todas as transações do mês
 * selecionado, cartão + Pix, num só lugar (FR-004, FR-010, FR-011,
 * FR-012), com navegação entre meses (FR-005..FR-009) e visão de mês
 * futuro previsto agrupada por fatura (FR-013, FR-014).
 */
export default function ComprasScreen() {
  const router = useRouter();
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  const [selected, setSelected] = useState({ year: todayYear, month: todayMonth });
  const [filter, setFilter] = useState<FilterOption>('TODOS');

  const { range } = useMonthRange();
  const { rows, loading: loadingRows } = useMonthPurchases(selected.year, selected.month);
  const { groups: forecastGroups, loading: loadingForecast } = useForecastInvoices(
    selected.year,
    selected.month,
  );

  const selectedIndex = monthIndex(selected.year, selected.month);
  const kind: MonthKind =
    selectedIndex === monthIndex(todayYear, todayMonth)
      ? 'atual'
      : selectedIndex < monthIndex(todayYear, todayMonth)
        ? 'passado'
        : 'futuro-previsto';

  const prevDisabled =
    !range.earliest || selectedIndex <= monthIndex(range.earliest.year, range.earliest.month);
  const nextDisabled =
    !range.latest || selectedIndex >= monthIndex(range.latest.year, range.latest.month);

  const goPrev = () => setSelected((current) => shiftMonth(current.year, current.month, -1));
  const goNext = () => setSelected((current) => shiftMonth(current.year, current.month, 1));

  const isForecast = kind === 'futuro-previsto';
  const forecastRows = forecastGroups.flatMap((group) => group.rows);
  const breakdown = computeBreakdown(isForecast ? forecastRows : rows);

  const filteredRows = rows.filter((row) => filter === 'TODOS' || row.formaPagamento === filter);
  const dayGroups = groupByDay(filteredRows, today);

  const monthNameLower = MONTH_NAMES[selected.month - 1].toLowerCase();
  const monthLabel = `${MONTH_NAMES[selected.month - 1]} · ${selected.year}`;
  const summaryLabel = isForecast ? `Previsto para ${monthNameLower}` : `Total gasto em ${monthNameLower}`;
  const loading = isForecast ? loadingForecast : loadingRows;

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

        <MonthNavigator
          label={monthLabel}
          onPrev={goPrev}
          onNext={goNext}
          prevDisabled={prevDisabled}
          nextDisabled={nextDisabled}
        />

        <Card
          backgroundColor="$surface"
          borderColor="$border"
          borderWidth={1}
          borderRadius="$lg"
          padding={20}
          gap="$3"
        >
          <YStack gap="$1">
            <Text fontSize={13} color="$textSecondary" fontWeight="500">
              {summaryLabel}
            </Text>
            <Money
              cents={breakdown.total}
              fontFamily="$heading"
              fontSize={30}
              fontWeight="600"
              color="$text"
            />
            {isForecast && (
              <Text fontSize={12.5} color="$textTertiary">
                {forecastRows.length} {forecastRows.length === 1 ? 'parcela prevista' : 'parcelas previstas'}
              </Text>
            )}
          </YStack>

          {breakdown.porFormaPagamento.length > 0 && (
            <>
              <XStack height={8} borderRadius={999} overflow="hidden" backgroundColor="$border">
                {breakdown.porFormaPagamento.map((entry) => (
                  <XStack
                    key={entry.formaPagamento}
                    flex={entry.total}
                    backgroundColor={BREAKDOWN_COLOR[entry.formaPagamento]}
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
                      backgroundColor={BREAKDOWN_COLOR[entry.formaPagamento]}
                    />
                    <Text fontSize={12} color="$textSecondary">
                      {BREAKDOWN_LABEL[entry.formaPagamento]}
                    </Text>
                    <Money cents={entry.total} fontSize={12} fontWeight="700" color="$text" />
                  </XStack>
                ))}
              </XStack>
            </>
          )}
        </Card>

        {!isForecast && (
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
                    {Icon && (
                      <Icon size={14} color={active ? colors.primaryDark : colors.textSecondary} />
                    )}
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
        )}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 12 }} />
        ) : isForecast ? (
          forecastGroups.length === 0 ? (
            <Text fontSize={13} color="$textSecondary" marginTop="$2">
              Nenhuma parcela prevista para este mês.
            </Text>
          ) : (
            forecastGroups.map((group) => (
              <YStack key={`${group.cartaoNome}-${group.dataVencimento.toISOString()}`} gap="$2">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize={15} fontWeight="600" color="$text">
                    Fatura {group.cartaoNome}
                  </Text>
                  <Text fontSize={12} color="$textTertiary">
                    vence {group.dataVencimento.getDate()}/{group.dataVencimento.getMonth() + 1}
                  </Text>
                </XStack>
                <YStack>
                  {group.rows.map((row, index) => (
                    <PurchaseRow key={row.parcelaId} row={row} isFirst={index === 0} />
                  ))}
                </YStack>
              </YStack>
            ))
          )
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
                  <PurchaseRow key={row.parcelaId} row={row} isFirst={index === 0} />
                ))}
              </YStack>
            </YStack>
          ))
        )}
      </ScrollView>

      {!isForecast && (
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
      )}
    </Screen>
  );
}
