import { useLocalSearchParams, useRouter } from 'expo-router';
import { Archive, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
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

  const sortedInvoices = [...invoices].sort(
    (a, b) => b.referenciaAno - a.referenciaAno || b.referenciaMes - a.referenciaMes,
  );

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
        <YStack flex={1}>
          <Text fontFamily="$heading" fontSize={18} fontWeight="600" color="$text">
            {card?.nome ?? 'Cartão'}
          </Text>
          <Text fontSize={12} color="$textTertiary">
            Fecha dia {card?.diaFechamento} · Vence dia {card?.diaVencimento}
          </Text>
        </YStack>
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
        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : sortedInvoices.length === 0 ? (
          <Text fontSize={13} color="$textSecondary">
            Nenhuma fatura ainda.
          </Text>
        ) : (
          <YStack>
            {sortedInvoices.map((invoice, index) => (
              <XStack
                key={invoice.id}
                paddingVertical={14}
                borderTopWidth={index === 0 ? 0 : 1}
                borderColor="$border"
                alignItems="center"
                justifyContent="space-between"
                onPress={() => router.push(`/cartoes/${cardId}/fatura/${invoice.id}`)}
              >
                <YStack>
                  <Text fontSize={15} fontWeight="600" color="$text">
                    {MONTH_NAMES[invoice.referenciaMes - 1]} {invoice.referenciaAno}
                  </Text>
                  <XStack marginTop={4}>
                    <StatusBadge status={invoice.status} />
                  </XStack>
                </YStack>
                <XStack alignItems="center" gap="$2">
                  <Money cents={invoice.total} fontSize={15} fontWeight="600" color="$text" />
                  <ChevronRight size={16} color="#6C6C6D" />
                </XStack>
              </XStack>
            ))}
          </YStack>
        )}
      </ScrollView>
    </Screen>
  );
}
