import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { ActivityIndicator } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import { useIncomeHistory } from '@/hooks/useIncome';

export default function RendaHistoricoScreen() {
  const router = useRouter();
  const { history, loading } = useIncomeHistory();

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
          Histórico de renda
        </Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : history.length === 0 ? (
          <Text fontSize={13} color="$textSecondary">
            Nenhuma renda configurada ainda.
          </Text>
        ) : (
          <YStack>
            {history.map((entry, index) => (
              <XStack
                key={entry.id}
                paddingVertical={14}
                borderTopWidth={index === 0 ? 0 : 1}
                borderColor="$border"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text fontSize={13} color="$textSecondary">
                  Vigente desde {entry.vigenteDesde.getDate()}/{entry.vigenteDesde.getMonth() + 1}/
                  {entry.vigenteDesde.getFullYear()}
                </Text>
                <Money cents={entry.valor} fontSize={15} fontWeight="600" color="$text" />
              </XStack>
            ))}
          </YStack>
        )}
      </ScrollView>
    </Screen>
  );
}
