import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Plus } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Card, ScrollView, Text, XStack, YStack } from 'tamagui';

import { Money } from '@/components/Money';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { TransactionAvatar } from '@/components/TransactionAvatar';
import { monthlySubscriptionsTotal } from '@/domain/subscriptions/monthlySubscriptionsTotal';
import { listCategories } from '@/repositories/categoriesRepository';
import { listActiveSubscriptions, type Subscription } from '@/repositories/subscriptionsRepository';

/** T088: lista de assinaturas ativas + total mensal somado (FR-018). */
export default function AssinaturasScreen() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([listActiveSubscriptions(), listCategories()])
        .then(([subscriptionList, categories]) => {
          setSubscriptions(subscriptionList);
          setCategoryIcons(Object.fromEntries(categories.map((c) => [c.id, c.icone])));
        })
        .finally(() => setLoading(false));
    }, []),
  );

  const total = monthlySubscriptionsTotal(subscriptions);

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
          Assinaturas
        </Text>

        <Card
          backgroundColor="$surface"
          borderColor="$border"
          borderWidth={1}
          borderRadius="$lg"
          padding={22}
        >
          <Text fontSize={13} color="$textSecondary">
            Total mensal
          </Text>
          {loading ? (
            <ActivityIndicator style={{ marginTop: 8 }} />
          ) : (
            <Money cents={total} fontSize={32} fontWeight="600" color="$text" marginTop="$2" />
          )}
        </Card>

        <YStack gap="$1">
          <Text fontSize={15} fontWeight="600" color="$text">
            Minhas assinaturas
          </Text>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 12 }} />
          ) : subscriptions.length === 0 ? (
            <Text fontSize={13} color="$textSecondary" marginTop="$3">
              Nenhuma assinatura cadastrada ainda.
            </Text>
          ) : (
            <YStack marginTop="$3">
              {subscriptions.map((subscription, index) => (
                <XStack
                  key={subscription.id}
                  paddingVertical={14}
                  borderTopWidth={index === 0 ? 0 : 1}
                  borderColor="$border"
                  justifyContent="space-between"
                  alignItems="center"
                  onPress={() => router.push(`/mais/assinaturas/${subscription.id}`)}
                  gap="$3"
                >
                  <TransactionAvatar
                    categoria={
                      subscription.categoriaId
                        ? { icone: categoryIcons[subscription.categoriaId] }
                        : null
                    }
                    size={36}
                  />
                  <YStack flex={1}>
                    <Text fontSize={15} fontWeight="600" color="$text">
                      {subscription.nome}
                    </Text>
                    <Text fontSize={12} color="$textTertiary">
                      {subscription.formaPagamento === 'PIX' ? 'Pix' : 'Cartão'} · dia{' '}
                      {subscription.diaCobranca}
                    </Text>
                  </YStack>
                  <Money
                    cents={subscription.valor}
                    fontSize={14.5}
                    fontWeight="600"
                    color="$text"
                  />
                  <ChevronRight size={16} color="#6C6C6D" />
                </XStack>
              ))}
            </YStack>
          )}
        </YStack>
      </ScrollView>

      <PrimaryButton
        onPress={() => router.push('/mais/assinaturas/nova')}
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
