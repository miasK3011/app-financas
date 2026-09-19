import { useFocusEffect, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { ScrollView, Text, XStack, YStack } from 'tamagui';

import { Money } from '@/components/Money';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { getReserveBalance, listReserves, type Reserve } from '@/repositories/reservesRepository';

type ReserveWithBalance = Reserve & { balance: number };

/** T124: lista de reservas + saldo de cada uma, com FAB "+" para nova reserva. */
export default function ReservasScreen() {
  const router = useRouter();
  const [reserves, setReserves] = useState<ReserveWithBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      listReserves()
        .then(async (list) => {
          const withBalances = await Promise.all(
            list.map(async (reserve) => ({
              ...reserve,
              balance: await getReserveBalance(reserve.id),
            })),
          );
          setReserves(withBalances);
        })
        .finally(() => setLoading(false));
    }, []),
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 22 }}>
        <Text fontFamily="$heading" fontSize={24} fontWeight="600" color="$text">
          Reservas
        </Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : reserves.length === 0 ? (
          <Text fontSize={13} color="$textSecondary">
            Nenhuma reserva cadastrada ainda.
          </Text>
        ) : (
          <YStack>
            {reserves.map((reserve, index) => (
              <XStack
                key={reserve.id}
                paddingVertical={14}
                borderTopWidth={index === 0 ? 0 : 1}
                borderColor="$border"
                justifyContent="space-between"
                alignItems="center"
                onPress={() => router.push(`/reservas/${reserve.id}`)}
              >
                <YStack>
                  <Text fontSize={15} fontWeight="600" color="$text">
                    {reserve.nome}
                  </Text>
                  {reserve.taxaRendimentoMensalPercentual != null && (
                    <Text fontSize={12} color="$textTertiary">
                      {reserve.taxaRendimentoMensalPercentual}% ao mês
                    </Text>
                  )}
                </YStack>
                <Money cents={reserve.balance} fontSize={15} fontWeight="600" color="$text" />
              </XStack>
            ))}
          </YStack>
        )}
      </ScrollView>

      <PrimaryButton
        onPress={() => router.push('/reservas/nova')}
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
