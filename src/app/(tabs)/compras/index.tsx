import { useRouter } from 'expo-router';
import { CreditCard, Plus, User, Users, Zap } from 'lucide-react-native';
import { memo, useDeferredValue, useMemo, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Card, ScrollView, Text, XStack, YStack } from 'tamagui';

import { DayGroupHeader } from '@/components/DayGroupHeader';
import { MonthNavigator } from '@/components/MonthNavigator';
import { Money } from '@/components/Money';
import { PurchaseAvatar } from '@/components/PaymentMethodBadge';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { FAB_SCROLL_PADDING } from '@/components/fabLayout';
import {
  applyPurchaseFilters,
  isUnfiltered,
  NO_FILTERS,
  type PurchaseFilters,
  toggleFormaPagamento,
  toggleSoMinhas,
} from '@/domain/purchasesOverview/filters';
import { groupByDay } from '@/domain/purchasesOverview/groupByDay';
import { computeBreakdown } from '@/domain/purchasesOverview/paymentBreakdown';
import type { FormaPagamento } from '@/domain/purchasesOverview/types';
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

/**
 * Chip de filtro com retorno visual imediato no toque (`pressStyle`) —
 * independente do recálculo da lista, que é adiado (`useDeferredValue`).
 */
const FilterChip = memo(function FilterChip({
  label,
  active,
  Icon,
  onPress,
}: {
  label: string;
  active: boolean;
  Icon?: typeof CreditCard;
  onPress: () => void;
}) {
  return (
    <XStack
      alignItems="center"
      gap="$2"
      paddingVertical={8}
      paddingHorizontal={14}
      borderRadius={999}
      borderWidth={1}
      borderColor={active ? '$primaryLight' : '$border'}
      backgroundColor={active ? '$primaryLight' : '$surface'}
      pressStyle={{ opacity: 0.6, scale: 0.96 }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
    >
      {Icon && <Icon size={14} color={active ? colors.primaryDark : colors.textSecondary} />}
      <Text fontSize={12.5} fontWeight="600" color={active ? '$primaryDark' : '$textSecondary'}>
        {label}
      </Text>
    </XStack>
  );
});

type RowView = {
  compraId: string;
  descricao: string;
  categoria: { icone: string; nome: string } | null;
  formaPagamento: FormaPagamento;
  nomeCartao: string | null;
  valor: number;
  valorResponsabilidade: number;
  /** "4x" (compra parcelada na linha do tempo), "k/N" (parcela/CSV) ou nada. */
  badge: string | null;
};

/**
 * Uma linha de transação — a mesma na linha do tempo (por Compra) e na
 * previsão (por Parcela). Compra dividida mostra o ícone de divisão e
 * "Sua parte", como no detalhe da fatura (FR-009 da 003).
 */
function PurchaseRow({ row, isFirst }: { row: RowView; isFirst: boolean }) {
  const router = useRouter();
  const isSplit = row.valorResponsabilidade < row.valor;
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
      <YStack flex={1} gap={2}>
        <XStack alignItems="center" gap="$1.5">
          <Text fontSize={14} fontWeight="600" color="$text" flexShrink={1} numberOfLines={1}>
            {row.descricao}
          </Text>
          {isSplit && (
            <XStack
              width={18}
              height={18}
              borderRadius={9}
              backgroundColor="$border"
              alignItems="center"
              justifyContent="center"
            >
              <Users size={11} color="#5B5B5E" />
            </XStack>
          )}
        </XStack>
        <Text fontSize={12} color="$textTertiary">
          {row.categoria?.nome ?? 'Sem categoria'}
          {row.formaPagamento === 'CARTAO' ? ` · ${row.nomeCartao}` : ' · Pix'}
        </Text>
        {isSplit && (
          <XStack gap="$1">
            <Text fontSize={12} color="$textTertiary">
              Sua parte:
            </Text>
            <Money cents={row.valorResponsabilidade} fontSize={12} color="$textTertiary" />
          </XStack>
        )}
      </YStack>
      <YStack alignItems="flex-end" gap="$1">
        <Money cents={row.valor} fontSize={14} fontWeight="600" color="$text" />
        {row.badge && (
          <XStack
            borderRadius={999}
            borderWidth={1}
            borderColor="$border"
            backgroundColor="$bg"
            paddingHorizontal={7}
            paddingVertical={2}
          >
            <Text fontSize={10.5} fontWeight="700" color="$textTertiary">
              {row.badge}
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
 * futuro previsto agrupada por fatura (FR-013, FR-014). Desde a 003 a
 * lista é uma linha do tempo das compras FEITAS no mês, pelo dia real
 * (FR-006/FR-007), com o filtro "Só minhas" (FR-008) e "Sua parte" no
 * card (FR-009).
 */
export default function ComprasScreen() {
  const router = useRouter();
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  const [selected, setSelected] = useState({ year: todayYear, month: todayMonth });
  const [filters, setFilters] = useState<PurchaseFilters>(NO_FILTERS);
  // Os chips refletem `filters` na hora; a lista e o card usam o valor
  // adiado, recalculado numa renderização de baixa prioridade — o toque
  // nunca espera a lista inteira ser redesenhada.
  const deferredFilters = useDeferredValue(filters);
  const isStale = filters !== deferredFilters;

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
  const todayKey = today.toDateString();
  const forecastRows = useMemo(
    () => forecastGroups.flatMap((group) => group.rows),
    [forecastGroups],
  );
  const filteredRows = useMemo(
    () => applyPurchaseFilters(rows, deferredFilters),
    [rows, deferredFilters],
  );
  // FR-009 (003): o card reflete exatamente o que a lista mostra.
  const breakdown = useMemo(
    () => computeBreakdown(isForecast ? forecastRows : filteredRows),
    [isForecast, forecastRows, filteredRows],
  );
  const dayGroups = useMemo(
    () => groupByDay(filteredRows, (row) => row.dataCompra, new Date(todayKey)),
    [filteredRows, todayKey],
  );
  const hasActiveFilter = !isUnfiltered(deferredFilters);
  // Memoizado: no toque de um chip (render urgente) a lista é o mesmo
  // elemento e o React nem a reconcilia; só o render adiado a refaz.
  const timelineList = useMemo(
    () =>
      dayGroups.map((group) => (
        <YStack key={group.date.toISOString()} gap="$2">
          <DayGroupHeader label={group.label} />
          <YStack>
            {group.rows.map((row, index) => (
              <PurchaseRow
                key={row.compraId}
                row={{
                  ...row,
                  // FR-006a: compra parcelada aparece uma vez com "Nx"; CSV "k/N" (research R9).
                  badge: !row.parcelas
                    ? null
                    : row.parcelas.atual > 1
                      ? `${row.parcelas.atual}/${row.parcelas.total}`
                      : `${row.parcelas.total}x`,
                }}
                isFirst={index === 0}
              />
            ))}
          </YStack>
        </YStack>
      )),
    [dayGroups],
  );

  const monthNameLower = MONTH_NAMES[selected.month - 1].toLowerCase();
  const monthLabel = `${MONTH_NAMES[selected.month - 1]} · ${selected.year}`;
  const summaryLabel = isForecast
    ? `Previsto para ${monthNameLower}`
    : `Total gasto em ${monthNameLower}`;
  const loading = isForecast ? loadingForecast : loadingRows;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: FAB_SCROLL_PADDING, gap: 18 }}
      >
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
          opacity={isStale ? 0.6 : 1}
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
            {breakdown.totalResponsabilidade !== breakdown.total && (
              <XStack gap="$1" alignItems="center">
                <Text fontSize={13} color="$textSecondary">
                  Sua parte:
                </Text>
                <Money
                  cents={breakdown.totalResponsabilidade}
                  fontSize={13}
                  fontWeight="700"
                  color="$textSecondary"
                />
              </XStack>
            )}
            {isForecast && (
              <Text fontSize={12.5} color="$textTertiary">
                {forecastRows.length}{' '}
                {forecastRows.length === 1 ? 'parcela prevista' : 'parcelas previstas'}
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
              <FilterChip
                label="Todos"
                active={isUnfiltered(filters)}
                onPress={() => setFilters(NO_FILTERS)}
              />
              <FilterChip
                label="Cartão"
                Icon={CreditCard}
                active={filters.formaPagamento === 'CARTAO'}
                onPress={() => setFilters((current) => toggleFormaPagamento(current, 'CARTAO'))}
              />
              <FilterChip
                label="Pix"
                Icon={Zap}
                active={filters.formaPagamento === 'PIX'}
                onPress={() => setFilters((current) => toggleFormaPagamento(current, 'PIX'))}
              />
              <FilterChip
                label="Só minhas"
                Icon={User}
                active={filters.soMinhas}
                onPress={() => setFilters(toggleSoMinhas)}
              />
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
                    <PurchaseRow
                      key={row.parcelaId}
                      row={{
                        ...row,
                        badge: row.parcela ? `${row.parcela.atual}/${row.parcela.total}` : null,
                      }}
                      isFirst={index === 0}
                    />
                  ))}
                </YStack>
              </YStack>
            ))
          )
        ) : dayGroups.length === 0 ? (
          <Text fontSize={13} color="$textSecondary" marginTop="$2">
            {hasActiveFilter
              ? `Nenhuma compra com esses filtros em ${monthNameLower}.`
              : 'Nenhuma compra registrada neste mês.'}
          </Text>
        ) : (
          <YStack gap={18} opacity={isStale ? 0.5 : 1}>
            {timelineList}
          </YStack>
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
