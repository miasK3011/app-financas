import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { TransactionAvatar } from '@/components/TransactionAvatar';
import {
  type EstablishmentWithPatternCount,
  listEstablishmentsWithPatternCount,
} from '@/repositories/establishmentsRepository';

/** T118: lista de estabelecimentos cadastrados, com FAB "+" para criar um novo. */
export default function EstabelecimentosScreen() {
  const router = useRouter();
  const [establishments, setEstablishments] = useState<EstablishmentWithPatternCount[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      listEstablishmentsWithPatternCount()
        .then(setEstablishments)
        .finally(() => setLoading(false));
    }, []),
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
        <Text fontFamily="$heading" fontSize={18} fontWeight="600" color="$text">
          Estabelecimentos
        </Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : establishments.length === 0 ? (
          <Text fontSize={13} color="$textSecondary" marginTop="$3">
            Nenhum estabelecimento cadastrado ainda.
          </Text>
        ) : (
          <YStack>
            {establishments.map((establishment, index) => (
              <XStack
                key={establishment.id}
                paddingVertical={14}
                borderTopWidth={index === 0 ? 0 : 1}
                borderColor="$border"
                alignItems="center"
                justifyContent="space-between"
                onPress={() => router.push(`/mais/estabelecimentos/${establishment.id}`)}
              >
                <XStack alignItems="center" gap="$3">
                  <TransactionAvatar
                    estabelecimento={{
                      logoCachePath: establishment.logoCachePath,
                      iconeRespaldo: establishment.iconeRespaldo,
                    }}
                  />
                  <YStack>
                    <Text fontSize={15} fontWeight="600" color="$text">
                      {establishment.nomeExibicao}
                    </Text>
                    <Text fontSize={12} color="$textTertiary">
                      {establishment.patternCount === 1
                        ? '1 padrão cadastrado'
                        : `${establishment.patternCount} padrões cadastrados`}
                    </Text>
                  </YStack>
                </XStack>
                <ChevronRight size={16} color="#6C6C6D" />
              </XStack>
            ))}
          </YStack>
        )}
      </ScrollView>

      <PrimaryButton
        onPress={() => router.push('/mais/estabelecimentos/novo')}
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
