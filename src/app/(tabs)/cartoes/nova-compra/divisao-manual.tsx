import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { AppInput } from '@/components/AppInput';
import { Money } from '@/components/Money';
import { MoneyInput } from '@/components/MoneyInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { requiresMotivoResponsavelFields } from '@/domain/expenseSplitting/requiresMotivoResponsavelFields';
import { getPurchase, updatePurchase } from '@/repositories/purchasesRepository';

/**
 * T108/NovaCompraDivisaoManual.dc.html: editar o valor de
 * responsabilidade manual de uma Compra + motivo/responsável
 * opcionais (FR-046/FR-047) — só alcançável quando a Compra não tem
 * nenhuma EntradaAvulsa vinculada (ver Editar Transação).
 */
export default function NovaCompraDivisaoManualScreen() {
  const router = useRouter();
  const { compraId } = useLocalSearchParams<{ compraId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [valorTotalOriginal, setValorTotalOriginal] = useState(0);
  const [valorResponsabilidade, setValorResponsabilidade] = useState<number | undefined>(undefined);
  const [motivo, setMotivo] = useState('');
  const [responsavel, setResponsavel] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!compraId) return;
      setLoading(true);
      getPurchase(compraId).then((purchase) => {
        if (purchase) {
          setValorTotalOriginal(purchase.valorTotalOriginal);
          setValorResponsabilidade(purchase.valorResponsabilidade ?? purchase.valorTotalOriginal);
          setMotivo(purchase.motivo ?? '');
          setResponsavel(purchase.responsavel ?? '');
        }
        setLoading(false);
      });
    }, [compraId]),
  );

  const handleSave = async () => {
    if (!compraId) return;
    setSaving(true);
    await updatePurchase(compraId, {
      valorResponsabilidade:
        valorResponsabilidade === undefined || valorResponsabilidade === valorTotalOriginal
          ? null
          : valorResponsabilidade,
      motivo: motivo || null,
      responsavel: responsavel || null,
    });
    setSaving(false);
    router.back();
  };

  if (loading) {
    return (
      <Screen>
        <YStack flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator />
        </YStack>
      </Screen>
    );
  }

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
          Divisão de responsabilidade
        </Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Valor de responsabilidade
          </Text>
          <MoneyInput value={valorResponsabilidade} onChangeValue={setValorResponsabilidade} />
          <Text fontSize={12.5} color="$textTertiary">
            De um total de{' '}
            <Money cents={valorTotalOriginal} fontSize={12.5} color="$textTertiary" />
          </Text>
        </YStack>

        {requiresMotivoResponsavelFields(valorResponsabilidade ?? null, valorTotalOriginal) && (
          <XStack gap="$3">
            <YStack flex={1} gap="$2">
              <Text fontSize={13} color="$textSecondary">
                Motivo (opcional)
              </Text>
              <AppInput
                value={motivo}
                onChangeText={setMotivo}
                placeholder="Ex.: Dividimos a conta"
              />
            </YStack>
            <YStack flex={1} gap="$2">
              <Text fontSize={13} color="$textSecondary">
                Responsável (opcional)
              </Text>
              <AppInput
                value={responsavel}
                onChangeText={setResponsavel}
                placeholder="Ex.: Maria"
              />
            </YStack>
          </XStack>
        )}

        <PrimaryButton
          onPress={handleSave}
          disabled={saving}
          color="white"
          fontWeight="700"
          borderRadius={999}
        >
          Salvar
        </PrimaryButton>
      </ScrollView>
    </Screen>
  );
}
