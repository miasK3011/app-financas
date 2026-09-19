import { useLocalSearchParams, useRouter } from 'expo-router';
import { Archive, ChevronLeft, ChevronRight, Plus, Upload } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { Money } from '@/components/Money';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { shouldShowResponsibilitySummary } from '@/domain/expenseSplitting/shouldShowResponsibilitySummary';
import { useCards } from '@/hooks/useCards';
import { useCardInvoices } from '@/hooks/useInvoice';
import { type Card, getCard } from '@/repositories/cardsRepository';

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

export default function CartaoFaturasScreen() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const router = useRouter();
  const { invoices, loading } = useCardInvoices(cardId);
  const { archive } = useCards();
  const [card, setCard] = useState<Card>();

  useEffect(() => {
    if (cardId) getCard(cardId).then(setCard);
  }, [cardId]);

  const handleArchive = () => {
    Alert.alert(
      'Arquivar cartão',
      'O cartão sai das opções de nova compra, mas o histórico é mantido.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Arquivar',
          style: 'destructive',
          onPress: async () => {
            await archive(cardId!);
            router.back();
          },
        },
      ],
    );
  };

  // Faturas "FUTURA" (parcelas já alocadas em meses que nem começaram
  // a fechar) vão para o fim da lista, da mais próxima para a mais
  // distante — as demais (ABERTA/FECHADA/PAGA) ficam no topo, da mais
  // recente para a mais antiga.
  const sortedInvoices = [...invoices].sort((a, b) => {
    const aFutura = a.status === 'FUTURA';
    const bFutura = b.status === 'FUTURA';
    if (aFutura !== bFutura) return aFutura ? 1 : -1;

    const order = b.referenciaAno - a.referenciaAno || b.referenciaMes - a.referenciaMes;
    return aFutura ? -order : order;
  });

  return (
    <Screen>
      <XStack alignItems="center" justifyContent="space-between" padding={20} paddingBottom={0}>
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
          <Text fontFamily="$heading" fontSize={19} fontWeight="600" color="$text">
            {card?.nome ?? 'Cartão'}
          </Text>
        </XStack>
        {!card?.arquivadoEm && (
          <Button
            onPress={handleArchive}
            circular
            size="$3"
            backgroundColor="$surface"
            borderColor="$border"
            borderWidth={1}
            icon={<Archive size={16} />}
          />
        )}
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 22 }}>
        <XStack
          backgroundColor="$surface"
          borderColor="$border"
          borderWidth={1}
          borderRadius="$lg"
          padding={18}
          alignItems="center"
          justifyContent="space-between"
          gap="$3"
        >
          <Text fontSize={13} color="$textSecondary">
            Fecha dia {card?.diaFechamento} · Vence dia {card?.diaVencimento}
          </Text>
          {!card?.arquivadoEm && (
            <Button
              onPress={() =>
                router.push({ pathname: '/cartao/importar-csv', params: { cartaoId: cardId } })
              }
              size="$3"
              backgroundColor="$primaryLight"
              color="$primaryDark"
              borderWidth={0}
              borderRadius={999}
              fontSize={12.5}
              fontWeight="600"
              icon={<Upload size={15} color="#234F3E" />}
            >
              Importar CSV
            </Button>
          )}
        </XStack>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : sortedInvoices.length === 0 ? (
          <Text fontSize={13} color="$textSecondary">
            Nenhuma fatura ainda.
          </Text>
        ) : (
          <YStack>
            <Text fontSize={15} fontWeight="600" color="$text" marginBottom="$3">
              Faturas
            </Text>
            {sortedInvoices.map((invoice, index) => {
              const isFuture = invoice.status === 'FUTURA';
              const showResponsibility =
                invoice.status === 'ABERTA' && shouldShowResponsibilitySummary(invoice);

              return (
                <XStack
                  key={invoice.id}
                  paddingVertical={16}
                  borderTopWidth={index === 0 ? 0 : 1}
                  borderColor="$border"
                  alignItems="center"
                  gap="$3"
                  onPress={() => router.push(`/cartao/${cardId}/fatura/${invoice.id}`)}
                >
                  <YStack flex={1}>
                    <Text fontSize={15} fontWeight="600" color={isFuture ? '$textSecondary' : '$text'}>
                      {MONTH_NAMES[invoice.referenciaMes - 1]} {invoice.referenciaAno}
                    </Text>
                    {showResponsibility && (
                      <Text fontSize={12.5} color="$textTertiary" marginTop={2}>
                        Sua responsabilidade:{' '}
                        <Money
                          cents={invoice.totalResponsabilidade}
                          fontSize={12.5}
                          color="$textTertiary"
                        />
                      </Text>
                    )}
                    {isFuture && (
                      <Text fontSize={12.5} color="$textTertiary" marginTop={2}>
                        Prevista · parcelas já alocadas
                      </Text>
                    )}
                  </YStack>
                  <YStack alignItems="flex-end" gap="$1.5">
                    {!isFuture && <StatusBadge status={invoice.status} />}
                    <Money
                      cents={invoice.total}
                      fontSize={17}
                      fontWeight="600"
                      color={isFuture ? '$textSecondary' : invoice.status === 'ABERTA' ? '$info' : '$text'}
                    />
                  </YStack>
                  <ChevronRight size={16} color="#6C6C6D" />
                </XStack>
              );
            })}
          </YStack>
        )}
      </ScrollView>

      {!card?.arquivadoEm && (
        <PrimaryButton
          onPress={() =>
            router.push({ pathname: '/nova-compra', params: { cartaoId: cardId } })
          }
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
