import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, CreditCard, Plus } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { Money } from '@/components/Money';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { TransactionAvatar } from '@/components/TransactionAvatar';
import { useBestCard } from '@/hooks/useBestCard';
import { useCards } from '@/hooks/useCards';
import { useInvoicesDueInMonth } from '@/hooks/useInvoice';
import { useMonthBalance } from '@/hooks/useMonthBalance';
import { useRecentPurchases } from '@/hooks/useRecentPurchases';
import {
  getMonthlySpendingHistory,
  type MonthlySpending,
} from '@/repositories/statisticsRepository';

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

/**
 * Início · Main (Main.dc.html): saldo do mês, faturas do mês, sugestão
 * de melhor cartão, gráfico de consumo (T097) e transações recentes —
 * issue #5, divergência de composição de tela mais reportada.
 */
export default function InicioScreen() {
  const router = useRouter();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const { balance, income, expenses, hasIncome } = useMonthBalance(year, month);
  const { invoices: invoicesDue } = useInvoicesDueInMonth(year, month);
  const { cards } = useCards();
  const { suggestion: bestCard } = useBestCard();
  const { purchases: recentPurchases, loading: loadingRecent } = useRecentPurchases(6);

  const [history, setHistory] = useState<MonthlySpending[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoadingChart(true);
      getMonthlySpendingHistory(6)
        .then(setHistory)
        .finally(() => setLoadingChart(false));
    }, []),
  );

  const monthsWithSpending = history.filter((entry) => entry.total > 0).length;
  const maxTotal = Math.max(1, ...history.map((entry) => entry.total));
  const bestCardName = cards.find((card) => card.id === bestCard?.cardId)?.nome;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 22 }}>
        <YStack gap="$1">
          <Text
            fontSize={12}
            fontWeight="700"
            color="$textTertiary"
            textTransform="uppercase"
            letterSpacing={0.9}
          >
            Resumo do mês
          </Text>
          <Text
            fontFamily="$heading"
            fontSize={27}
            fontWeight="600"
            letterSpacing={-0.3}
            color="$text"
          >
            {MONTH_NAMES[month - 1]} {year}
          </Text>
        </YStack>

        <YStack
          backgroundColor="$surface"
          borderColor="$border"
          borderWidth={1}
          borderRadius="$lg"
          padding={22}
          gap="$1"
        >
          <Text fontSize={13} fontWeight="500" color="$textSecondary">
            Saldo do mês
          </Text>
          <Money
            cents={balance}
            fontFamily="$heading"
            fontSize={34}
            fontWeight="600"
            color="$primary"
          />
          {hasIncome && (
            <Text fontSize={13} color="$textSecondary" marginBottom="$2">
              Renda <Money cents={income} fontSize={13} color="$textSecondary" /> · Gastos{' '}
              <Money cents={expenses} fontSize={13} color="$textSecondary" />
            </Text>
          )}
          <XStack gap="$2" marginTop="$2">
            <Button
              onPress={() => router.push('/renda/nova-entrada')}
              size="$3"
              backgroundColor="$primaryLight"
              color="$primaryDark"
              fontWeight="600"
              fontSize={13}
              borderRadius={999}
              icon={<Plus size={16} color="#234F3E" />}
            >
              Adicionar Saldo
            </Button>
            <Button
              onPress={() => router.push('/renda')}
              size="$3"
              backgroundColor="transparent"
              borderColor="$border"
              borderWidth={1}
              color="$textSecondary"
              fontWeight="600"
              fontSize={13}
              borderRadius={999}
            >
              Editar renda
            </Button>
          </XStack>
        </YStack>

        {invoicesDue.length > 0 && (
          <YStack gap="$2">
            <Text fontSize={15} fontWeight="600" color="$text">
              Faturas do mês
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <XStack gap="$3">
                {invoicesDue.map((invoice) => {
                  const cardName = cards.find((card) => card.id === invoice.cartaoId)?.nome;
                  return (
                    <YStack
                      key={invoice.id}
                      width={152}
                      backgroundColor="$surface"
                      borderColor="$border"
                      borderWidth={1}
                      borderRadius="$md"
                      padding={14}
                      gap="$2"
                      onPress={() => router.push(`/cartao/${invoice.cartaoId}`)}
                    >
                      <XStack alignItems="center" justifyContent="space-between">
                        <Text fontSize={13} fontWeight="600" color="$text">
                          {cardName ?? 'Cartão'}
                        </Text>
                        <CreditCard size={16} color="#6C6C6D" />
                      </XStack>
                      <Money
                        cents={invoice.total}
                        fontFamily="$heading"
                        fontSize={18}
                        fontWeight="600"
                        color="$text"
                      />
                      <Text fontSize={12} color="$textTertiary">
                        vence {invoice.dataVencimento.getDate()}/
                        {invoice.dataVencimento.getMonth() + 1}
                      </Text>
                    </YStack>
                  );
                })}
              </XStack>
            </ScrollView>
          </YStack>
        )}

        {cards.length > 1 && bestCard && bestCardName && (
          <XStack
            backgroundColor="$primaryLight"
            borderRadius="$lg"
            padding={16}
            gap="$3"
            alignItems="center"
            onPress={() => router.push(`/cartao/${bestCard.cardId}`)}
          >
            <XStack
              width={40}
              height={40}
              borderRadius="$md"
              backgroundColor="$primary"
              alignItems="center"
              justifyContent="center"
            >
              <CreditCard size={20} color="white" />
            </XStack>
            <YStack flex={1}>
              <Text fontSize={13} fontWeight="700" color="$primaryDark">
                Melhor cartão para comprar hoje
              </Text>
              <Text fontSize={13} color="$textSecondary" marginTop={2}>
                <Text fontWeight="700" color="$textSecondary">
                  {bestCardName}
                </Text>{' '}
                — próxima fatura fecha em {bestCard.daysUntilClosing} dias, maior prazo até lá
              </Text>
            </YStack>
          </XStack>
        )}

        <YStack gap="$2">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize={15} fontWeight="600" color="$text">
              Consumo mensal
            </Text>
            <XStack
              alignItems="center"
              gap="$1"
              onPress={() => router.push('/inicio/estatisticas')}
            >
              <Text fontSize={13} color="$primary" fontWeight="600">
                Ver estatísticas
              </Text>
              <ChevronRight size={16} color="#2E6F55" />
            </XStack>
          </XStack>

          <YStack
            backgroundColor="$surface"
            borderColor="$border"
            borderWidth={1}
            borderRadius="$md"
            padding={14}
            onPress={() => router.push('/inicio/estatisticas')}
          >
            {loadingChart ? (
              <ActivityIndicator />
            ) : monthsWithSpending < 2 ? (
              <Text fontSize={13} color="$textSecondary">
                Ainda não há histórico suficiente (pelo menos 2 meses com gastos) para o gráfico.
              </Text>
            ) : (
              <XStack
                alignItems="flex-end"
                justifyContent="space-between"
                height={CHART_HEIGHT + 24}
              >
                {history.map((entry) => (
                  <YStack
                    key={`${entry.year}-${entry.month}`}
                    alignItems="center"
                    gap="$1"
                    flex={1}
                  >
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
          </YStack>
        </YStack>

        <YStack gap="$2">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize={15} fontWeight="600" color="$text">
              Transações recentes
            </Text>
            <XStack alignItems="center" gap="$1" onPress={() => router.push('/compras')}>
              <Text fontSize={13} color="$primary" fontWeight="600">
                Ver tudo
              </Text>
              <ChevronRight size={16} color="#2E6F55" />
            </XStack>
          </XStack>
          {loadingRecent ? (
            <ActivityIndicator style={{ marginTop: 12 }} />
          ) : recentPurchases.length === 0 ? (
            <Text fontSize={13} color="$textSecondary">
              Nenhuma compra registrada ainda.
            </Text>
          ) : (
            <YStack>
              {recentPurchases.map((row, index) => (
                <XStack
                  key={row.compra.id}
                  paddingVertical={10}
                  borderTopWidth={index === 0 ? 0 : 1}
                  borderColor="$border"
                  alignItems="center"
                  gap="$3"
                  onPress={() => router.push(`/compra/${row.compra.id}`)}
                >
                  <TransactionAvatar
                    estabelecimento={row.estabelecimento}
                    categoria={row.categoria}
                    size={38}
                  />
                  <YStack flex={1}>
                    <Text fontSize={14} fontWeight="600" color="$text">
                      {row.estabelecimento?.nomeExibicao || row.compra.descricao}
                    </Text>
                    <Text fontSize={12} color="$textTertiary">
                      {row.categoria?.nome ?? 'Sem categoria'}
                    </Text>
                  </YStack>
                  <Money
                    cents={row.compra.valorTotalOriginal}
                    fontSize={14}
                    fontWeight="600"
                    color="$text"
                  />
                </XStack>
              ))}
            </YStack>
          )}
        </YStack>
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
