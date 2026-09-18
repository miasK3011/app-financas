import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { ActivityIndicator } from 'react-native';
import { Button, Card, ScrollView, Text, XStack, YStack } from 'tamagui';

import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { useBestCard } from '@/hooks/useBestCard';
import { useCards } from '@/hooks/useCards';
import { useOpenInvoicesTotal } from '@/hooks/useInvoice';

export default function CartoesScreen() {
  const router = useRouter();
  const { cards, loading: cardsLoading } = useCards(true);
  const { total, loading: totalLoading } = useOpenInvoicesTotal();
  const { suggestion: bestCard } = useBestCard();
  const bestCardName = cards.find((card) => card.id === bestCard?.cardId)?.nome;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 22 }}>
        <Text fontFamily="$heading" fontSize={24} fontWeight="600" color="$text">
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
              Melhor cartão para comprar hoje: <Text fontWeight="700">{bestCardName}</Text> (vence
              em {bestCard.daysUntilDue} dias)
            </Text>
          </Card>
        )}

        <Button
          onPress={() => router.push('/cartoes/importar-csv')}
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
                  onPress={() => router.push(`/cartoes/${card.id}`)}
                  opacity={card.arquivadoEm ? 0.5 : 1}
                >
                  <YStack>
                    <Text fontSize={15} fontWeight="600" color="$text">
                      {card.nome}
                    </Text>
                    <Text fontSize={12} color="$textTertiary">
                      Fecha dia {card.diaFechamento} · Vence dia {card.diaVencimento}
                      {card.arquivadoEm ? ' · Arquivado' : ''}
                    </Text>
                  </YStack>
                </XStack>
              ))}
            </YStack>
          )}
        </YStack>
      </ScrollView>

      <Button
        onPress={() => router.push('/cartoes/novo')}
        position="absolute"
        bottom={24}
        right={20}
        width={56}
        height={56}
        borderRadius={28}
        backgroundColor="$primary"
        icon={<Plus color="white" size={24} />}
      />
    </Screen>
  );
}
