import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { Money } from '@/components/Money';
import { Screen } from '@/components/Screen';
import {
  type CashEntry,
  linkCashEntryToCompra,
  listAllCashEntries,
} from '@/repositories/cashEntriesRepository';

/**
 * T109/NovaCompraDivisaoVinculada.dc.html: escolher uma EntradaAvulsa
 * já existente para vincular como reembolso de uma Compra (FR-050) —
 * o valor de responsabilidade passa a ser calculado automaticamente
 * (ver `resolveResponsibility`, FR-051).
 */
export default function NovaCompraDivisaoVinculadaScreen() {
  const router = useRouter();
  const { compraId } = useLocalSearchParams<{ compraId: string }>();
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      listAllCashEntries()
        .then(setEntries)
        .finally(() => setLoading(false));
    }, []),
  );

  const availableEntries = entries.filter((entry) => entry.compraVinculadaId === null);

  const handleLink = async (entryId: string) => {
    if (!compraId) return;
    setLinkingId(entryId);
    await linkCashEntryToCompra(entryId, compraId);
    router.back();
  };

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
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
          Vincular entrada avulsa
        </Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
        <Text fontSize={13} color="$textSecondary">
          Escolha uma entrada avulsa (ex.: um reembolso já recebido) para vincular a esta compra.
        </Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : availableEntries.length === 0 ? (
          <Text fontSize={13} color="$textTertiary" marginTop="$3">
            Nenhuma entrada avulsa disponível para vincular. Cadastre uma em Renda & Entradas.
          </Text>
        ) : (
          <YStack>
            {availableEntries.map((entry, index) => (
              <XStack
                key={entry.id}
                paddingVertical={14}
                borderTopWidth={index === 0 ? 0 : 1}
                borderColor="$border"
                justifyContent="space-between"
                alignItems="center"
                onPress={() => handleLink(entry.id)}
                opacity={linkingId && linkingId !== entry.id ? 0.5 : 1}
              >
                <YStack>
                  <Text fontSize={14.5} fontWeight="600" color="$text">
                    {entry.descricao}
                  </Text>
                  <Text fontSize={12} color="$textTertiary">
                    {entry.data.getDate()}/{entry.data.getMonth() + 1}
                  </Text>
                </YStack>
                <Money cents={entry.valor} fontSize={14.5} fontWeight="600" color="$success" />
              </XStack>
            ))}
          </YStack>
        )}
      </ScrollView>
    </Screen>
  );
}
