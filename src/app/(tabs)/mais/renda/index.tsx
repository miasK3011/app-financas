import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { Money } from '@/components/Money';
import { MoneyInput } from '@/components/MoneyInput';
import { Screen } from '@/components/Screen';
import { useIncome } from '@/hooks/useIncome';
import { useMonthBalance } from '@/hooks/useMonthBalance';

export default function RendaScreen() {
  const router = useRouter();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const { income, loading: incomeLoading, updateIncome } = useIncome(year, month);
  const { balance, entries, hasIncome, loading, removeEntry } = useMonthBalance(year, month);
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState<number | undefined>(undefined);

  const isEmpty = !hasIncome && entries.length === 0;

  const handleSaveIncome = async () => {
    if (incomeInput !== undefined && incomeInput > 0) {
      await updateIncome(incomeInput, new Date());
    }
    setEditingIncome(false);
    setIncomeInput(undefined);
  };

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
          Renda & Entradas
        </Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 22 }}>
        {loading || incomeLoading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : isEmpty ? (
          <YStack alignItems="center" paddingTop={40} gap="$2">
            <Text fontSize={15} fontWeight="600" color="$text" textAlign="center">
              Nenhuma renda ou entrada este mês
            </Text>
            <Text fontSize={13} color="$textSecondary" textAlign="center">
              Configure sua renda mensal ou adicione uma entrada avulsa para começar a acompanhar
              seu saldo.
            </Text>
          </YStack>
        ) : (
          <YStack
            backgroundColor="$surface"
            borderColor="$border"
            borderWidth={1}
            borderRadius="$lg"
            padding={22}
            gap="$1"
          >
            <Text fontSize={13} color="$textSecondary">
              Saldo do mês
            </Text>
            <Money cents={balance} fontSize={32} fontWeight="600" color="$text" />
          </YStack>
        )}

        <YStack gap="$2">
          <Text fontSize={15} fontWeight="600" color="$text">
            Renda mensal
          </Text>
          {editingIncome ? (
            <XStack gap="$2" alignItems="center">
              <MoneyInput
                flex={1}
                value={incomeInput}
                onChangeValue={setIncomeInput}
                borderColor="$border"
                borderRadius="$md"
                autoFocus
              />
              <Button
                onPress={handleSaveIncome}
                backgroundColor="$primary"
                color="white"
                fontWeight="700"
              >
                Salvar
              </Button>
            </XStack>
          ) : (
            <XStack justifyContent="space-between" alignItems="center">
              {income ? (
                <Money cents={income.valor} fontSize={20} fontWeight="600" color="$text" />
              ) : (
                <Text fontSize={13} color="$textTertiary">
                  Nenhuma renda configurada
                </Text>
              )}
              <Button
                onPress={() => setEditingIncome(true)}
                size="$3"
                backgroundColor="$surface"
                borderColor="$border"
                borderWidth={1}
              >
                {income ? 'Editar' : 'Configurar'}
              </Button>
            </XStack>
          )}
        </YStack>

        <Button
          onPress={() =>
            router.push({ pathname: '/cartoes/nova-compra', params: { formaPagamento: 'PIX' } })
          }
          backgroundColor="$surface"
          borderColor="$border"
          borderWidth={1}
          color="$primary"
          fontWeight="700"
        >
          Registrar compra via Pix
        </Button>

        <YStack gap="$2">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize={15} fontWeight="600" color="$text">
              Entradas avulsas
            </Text>
            <Button
              onPress={() => router.push('/mais/renda/historico')}
              size="$2"
              chromeless
              color="$primary"
              fontWeight="600"
            >
              Histórico de renda
            </Button>
          </XStack>

          {entries.length === 0 ? (
            <Text fontSize={13} color="$textSecondary">
              Nenhuma entrada avulsa este mês.
            </Text>
          ) : (
            entries.map((entry, index) => (
              <XStack
                key={entry.id}
                paddingVertical={14}
                borderTopWidth={index === 0 ? 0 : 1}
                borderColor="$border"
                justifyContent="space-between"
                alignItems="center"
              >
                <YStack>
                  <Text fontSize={14.5} fontWeight="600" color="$text">
                    {entry.descricao}
                  </Text>
                  <Text fontSize={12} color="$textTertiary">
                    {entry.data.getDate()}/{entry.data.getMonth() + 1}
                  </Text>
                </YStack>
                <XStack alignItems="center" gap="$3">
                  <Money cents={entry.valor} fontSize={14.5} fontWeight="600" color="$success" />
                  <Button
                    onPress={() => removeEntry(entry.id)}
                    size="$2"
                    circular
                    chromeless
                    icon={<Trash2 size={16} color="#C74A3C" />}
                  />
                </XStack>
              </XStack>
            ))
          )}
        </YStack>
      </ScrollView>

      <Button
        onPress={() => router.push('/mais/renda/nova-entrada')}
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
