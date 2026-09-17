import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { ActivityIndicator } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
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
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>();
  const router = useRouter();
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

  const showResponsibility = invoice.totalResponsabilidade !== invoice.total;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 22 }}>
        <XStack alignItems="center" gap="$3">
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
            {MONTH_NAMES[invoice.referenciaMes - 1]} {invoice.referenciaAno}
          </Text>
        </XStack>

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
            <XStack
              borderTopWidth={1}
              borderColor="$border"
              paddingTop="$2"
              marginTop="$1"
              gap="$1"
            >
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
            purchases.map((row, index) => (
              <XStack
                key={row.parcelaId}
                paddingVertical={14}
                borderTopWidth={index === 0 ? 0 : 1}
                borderColor="$border"
                justifyContent="space-between"
                alignItems="center"
              >
                <YStack flex={1}>
                  <Text fontSize={14.5} fontWeight="600" color="$text">
                    {row.compra.descricao}
                    {row.compra.parcelasTotal > 1
                      ? ` (${row.numero}/${row.compra.parcelasTotal})`
                      : ''}
                  </Text>
                  {row.valorResponsabilidade !== row.valor && (
                    <XStack marginTop={2} gap="$1">
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
              </XStack>
            ))
          )}
        </YStack>

        {invoice.status !== 'PAGA' && (
          <Button
            onPress={markAsPaid}
            backgroundColor="$primary"
            color="white"
            fontWeight="700"
            borderRadius={999}
          >
            Marcar fatura como paga
          </Button>
        )}
      </ScrollView>
    </Screen>
  );
}
