import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react-native';
import { ActivityIndicator } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { Money } from '@/components/Money';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { TransactionAvatar } from '@/components/TransactionAvatar';
import { shouldShowResponsibilitySummary } from '@/domain/expenseSplitting/shouldShowResponsibilitySummary';
import { useCard } from '@/hooks/useCards';
import { useInvoice, useInvoicePurchases } from '@/hooks/useInvoice';

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

export default function FaturaDetalheScreen() {
  const { cardId, invoiceId } = useLocalSearchParams<{ cardId: string; invoiceId: string }>();
  const router = useRouter();
  const { card } = useCard(cardId);
  const { invoice, loading, markAsPaid } = useInvoice(invoiceId);
  const { purchases, loading: purchasesLoading } = useInvoicePurchases(invoiceId);

  if (loading || !invoice) {
    return (
      <Screen>
        <YStack flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator />
        </YStack>
      </Screen>
    );
  }

  const showResponsibility = shouldShowResponsibilitySummary(invoice);

  return (
    <Screen>
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
          <Text
            fontSize={12}
            fontWeight="700"
            color="$textTertiary"
            textTransform="uppercase"
            letterSpacing={0.9}
          >
            {card?.nome}
          </Text>
          <Text fontFamily="$heading" fontSize={20} fontWeight="600" color="$text">
            {MONTH_NAMES[invoice.referenciaMes - 1]} {invoice.referenciaAno}
          </Text>
        </YStack>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 22 }}>
        <YStack
          backgroundColor="$surface"
          borderColor="$border"
          borderWidth={1}
          borderRadius="$lg"
          padding={22}
          gap="$2"
        >
          <Money cents={invoice.total} fontSize={32} fontWeight="600" color="$text" />
          <XStack alignItems="center" gap="$2">
            <StatusBadge status={invoice.status} />
            <Text fontSize={13} color="$textSecondary">
              vence {invoice.dataVencimento.getDate()}/{invoice.dataVencimento.getMonth() + 1}
            </Text>
          </XStack>
          {showResponsibility && (
            <XStack borderTopWidth={1} borderColor="$border" paddingTop="$2" gap="$1">
              <Text fontSize={13} color="$textSecondary">
                Você paga
              </Text>
              <Money
                cents={invoice.totalResponsabilidade}
                fontSize={13}
                fontWeight="700"
                color="$text"
              />
            </XStack>
          )}
        </YStack>

        <YStack>
          <Text fontSize={15} fontWeight="600" color="$text" marginBottom="$3">
            Compras desta fatura
          </Text>
          {purchasesLoading ? (
            <ActivityIndicator />
          ) : purchases.length === 0 ? (
            <Text fontSize={13} color="$textSecondary">
              Nenhuma compra nesta fatura.
            </Text>
          ) : (
            purchases.map((row, index) => {
              const isSplit = row.valorResponsabilidade !== row.valor;
              const isUnrecognized = row.compra.origem === 'CSV_IMPORT' && !row.estabelecimento;

              return (
                <XStack
                  key={row.parcelaId}
                  paddingVertical={14}
                  borderTopWidth={index === 0 ? 0 : 1}
                  borderColor="$border"
                  alignItems="center"
                  gap="$3"
                  onPress={() => router.push(`/cartoes/compra/${row.compra.id}`)}
                >
                  <TransactionAvatar
                    estabelecimento={row.estabelecimento}
                    categoria={row.categoria}
                  />
                  <YStack flex={1} gap={2}>
                    <XStack alignItems="center" gap="$1.5" flexWrap="wrap">
                      <Text fontSize={14.5} fontWeight="600" color="$text">
                        {row.compra.descricao}
                      </Text>
                      {row.compra.parcelasTotal > 1 && (
                        <XStack
                          backgroundColor="$primaryLight"
                          borderRadius={999}
                          paddingHorizontal={7}
                          paddingVertical={2}
                        >
                          <Text fontSize={11} fontWeight="700" color="$primaryDark">
                            {row.numero}/{row.compra.parcelasTotal}
                          </Text>
                        </XStack>
                      )}
                      {row.tags.map((tag) => (
                        <XStack
                          key={tag}
                          backgroundColor="$border"
                          borderRadius={999}
                          paddingHorizontal={7}
                          paddingVertical={2}
                        >
                          <Text fontSize={11} fontWeight="700" color="$textSecondary">
                            {tag}
                          </Text>
                        </XStack>
                      ))}
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
                      {isUnrecognized ? ' · não reconhecido' : ''}
                    </Text>
                    {isSplit && (
                      <XStack gap="$1">
                        <Text fontSize={12} color="$textTertiary">
                          Sua parte:
                        </Text>
                        <Money
                          cents={row.valorResponsabilidade}
                          fontSize={12}
                          color="$textTertiary"
                        />
                      </XStack>
                    )}
                  </YStack>
                  <Money cents={row.valor} fontSize={14.5} fontWeight="600" color="$text" />
                  <ChevronRight size={16} color="#6C6C6D" />
                </XStack>
              );
            })
          )}
        </YStack>

        {invoice.status !== 'PAGA' && (
          <PrimaryButton onPress={markAsPaid} color="white" fontWeight="700" borderRadius={999}>
            Marcar fatura como paga
          </PrimaryButton>
        )}
      </ScrollView>
    </Screen>
  );
}
