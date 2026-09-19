import { useRouter } from 'expo-router';
import { ChevronRight, CreditCard, Plus } from 'lucide-react-native';
import { ActivityIndicator } from 'react-native';
import { Button, Card, ScrollView, Text, XStack, YStack } from 'tamagui';

import { Money } from '@/components/Money';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { useBestCard } from '@/hooks/useBestCard';
import { useCards } from '@/hooks/useCards';
import { useOpenInvoicesByCard, useOpenInvoicesTotal } from '@/hooks/useInvoice';

export default function CartoesScreen() {
  const router = useRouter();
  const { cards, loading: cardsLoading } = useCards(true);
  const { total, loading: totalLoading } = useOpenInvoicesTotal();
  const { totalsByCard } = useOpenInvoicesByCard();
  const { suggestion: bestCard } = useBestCard();
  const bestCardName = cards.find((card) => card.id === bestCard?.cardId)?.nome;

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
          Cartões
        </Text>

        <Card
          backgroundColor="$surface"
          borderColor="$border"
          borderWidth={1}
          borderRadius="$lg"
          padding={22}
        >
          <Text fontSize={13} color="$textSecondary">
            Total das faturas abertas
          </Text>
          {totalLoading ? (
            <ActivityIndicator style={{ marginTop: 8 }} />
          ) : (
            <Money cents={total} fontSize={32} fontWeight="600" color="$text" marginTop="$2" />
          )}
        </Card>

        {bestCard && bestCardName && (
          <Card
            backgroundColor="$infoBg"
            borderColor="$border"
            borderWidth={1}
            borderRadius="$lg"
            padding={16}
          >
            <Text fontSize={13} color="$infoDark">
              Melhor cartão para comprar hoje: <Text fontWeight="700">{bestCardName}</Text> (fecha
              em {bestCard.daysUntilClosing} dias)
            </Text>
          </Card>
        )}

        <Button
          onPress={() => router.push('/cartao/importar-csv')}
          backgroundColor="$surface"
          borderColor="$border"
          borderWidth={1}
          color="$primary"
          fontWeight="700"
        >
          Importar fatura via CSV
        </Button>

        <YStack gap="$1">
          <Text fontSize={15} fontWeight="600" color="$text">
            Meus cartões
          </Text>

          {cardsLoading ? (
            <ActivityIndicator style={{ marginTop: 12 }} />
          ) : cards.length === 0 ? (
            <Text fontSize={13} color="$textSecondary" marginTop="$3">
              Nenhum cartão cadastrado ainda.
            </Text>
          ) : (
            <YStack marginTop="$3">
              {cards.map((card, index) => (
                <XStack
                  key={card.id}
                  paddingVertical={14}
                  borderTopWidth={index === 0 ? 0 : 1}
                  borderColor="$border"
                  justifyContent="space-between"
                  alignItems="center"
                  onPress={() => router.push(`/cartao/${card.id}`)}
                  opacity={card.arquivadoEm ? 0.5 : 1}
                  gap="$3"
                >
                  <XStack
                    width={42}
                    height={42}
                    borderRadius="$md"
                    backgroundColor="$primaryLight"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <CreditCard size={20} color="#234F3E" />
                  </XStack>
                  <YStack flex={1}>
                    <Text fontSize={15} fontWeight="600" color="$text">
                      {card.nome}
                    </Text>
                    <Text fontSize={12} color="$textTertiary">
                      Fecha dia {card.diaFechamento} · Vence dia {card.diaVencimento}
                      {card.arquivadoEm ? ' · Arquivado' : ''}
                    </Text>
                  </YStack>
                  {totalsByCard[card.id] !== undefined && (
                    <Money
                      cents={totalsByCard[card.id]}
                      fontFamily="$heading"
                      fontSize={17}
                      fontWeight="600"
                      color="$text"
                    />
                  )}
                  <ChevronRight size={16} color="#6C6C6D" />
                </XStack>
              ))}
            </YStack>
          )}
        </YStack>
      </ScrollView>

      <PrimaryButton
        onPress={() => router.push('/cartoes/novo')}
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
