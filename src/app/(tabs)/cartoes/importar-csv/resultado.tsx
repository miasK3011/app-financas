import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { Screen } from '@/components/Screen';

type SkippedRow = { rawLine: string; reason: string };

/** T078: contagem de linhas importadas/ignoradas com motivo (FR-026). */
export default function ImportarCsvResultadoScreen() {
  const router = useRouter();
  const { totalLinhas, linhasImportadas, linhasIgnoradas, skipped } = useLocalSearchParams<{
    totalLinhas: string;
    linhasImportadas: string;
    linhasIgnoradas: string;
    skipped?: string;
  }>();

  const skippedRows: SkippedRow[] = skipped ? JSON.parse(skipped) : [];

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
        <Text fontFamily="$heading" fontSize={20} fontWeight="600" color="$text">
          Importação concluída
        </Text>

        <YStack
          backgroundColor="$surface"
          borderColor="$border"
          borderWidth={1}
          borderRadius="$lg"
          padding={22}
          gap="$2"
        >
          <XStack justifyContent="space-between">
            <Text fontSize={13} color="$textSecondary">
              Total de linhas
            </Text>
            <Text fontSize={14.5} fontWeight="600" color="$text">
              {totalLinhas}
            </Text>
          </XStack>
          <XStack justifyContent="space-between">
            <Text fontSize={13} color="$textSecondary">
              Importadas
            </Text>
            <Text fontSize={14.5} fontWeight="600" color="$success">
              {linhasImportadas}
            </Text>
          </XStack>
          <XStack justifyContent="space-between">
            <Text fontSize={13} color="$textSecondary">
              Ignoradas
            </Text>
            <Text fontSize={14.5} fontWeight="600" color="$error">
              {linhasIgnoradas}
            </Text>
          </XStack>
        </YStack>

        {skippedRows.length > 0 && (
          <YStack gap="$2">
            <Text fontSize={15} fontWeight="600" color="$text">
              Linhas ignoradas
            </Text>
            {skippedRows.map((row, index) => (
              <YStack
                key={index}
                paddingVertical={10}
                borderTopWidth={index === 0 ? 0 : 1}
                borderColor="$border"
              >
                <Text fontSize={13} color="$text" numberOfLines={1}>
                  {row.rawLine}
                </Text>
                <Text fontSize={12} color="$textTertiary">
                  {row.reason}
                </Text>
              </YStack>
            ))}
          </YStack>
        )}

        <Button
          onPress={() => router.back()}
          backgroundColor="$primary"
          color="white"
          fontWeight="700"
          borderRadius={999}
        >
          Concluir
        </Button>
      </ScrollView>
    </Screen>
  );
}
