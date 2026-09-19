import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { AppInput } from '@/components/AppInput';
import { DateField } from '@/components/DateField';
import { Money } from '@/components/Money';
import { MoneyInput } from '@/components/MoneyInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import {
  createReserveEntry,
  listReserveEntries,
  type ReserveEntry,
} from '@/repositories/reserveEntriesRepository';
import {
  createReserve,
  getReserve,
  getReserveBalance,
  updateReserve,
} from '@/repositories/reservesRepository';

type LancamentoTipo = 'DEPOSITO' | 'RETIRADA' | 'RENDIMENTO_MANUAL';

const TIPO_LABELS: Record<LancamentoTipo, string> = {
  DEPOSITO: 'Depósito',
  RETIRADA: 'Retirada',
  RENDIMENTO_MANUAL: 'Rendimento',
};

/**
 * T125: reutilizada para criar (`reserveId === 'nova'`) e editar uma
 * Reserva existente — que, uma vez salva, ganha o extrato de
 * lançamentos e o formulário de novo lançamento manual. Taxa de
 * rendimento é só cadastro (FR-021) — nenhum job a aplica automaticamente.
 */
export default function ReservaDetalheScreen() {
  const router = useRouter();
  const { reserveId } = useLocalSearchParams<{ reserveId: string }>();
  const isNew = reserveId === 'nova';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(isNew ? null : reserveId);
  const [nome, setNome] = useState('');
  const [taxaText, setTaxaText] = useState('');
  const [balance, setBalance] = useState(0);
  const [entries, setEntries] = useState<ReserveEntry[]>([]);

  const [novoTipo, setNovoTipo] = useState<LancamentoTipo>('DEPOSITO');
  const [novoValor, setNovoValor] = useState<number | undefined>(undefined);
  const [novaData, setNovaData] = useState(new Date());
  const [novaObservacao, setNovaObservacao] = useState('');
  const [addingEntry, setAddingEntry] = useState(false);

  const loadExisting = useCallback(async (id: string) => {
    const [reserve, balanceValue, entryList] = await Promise.all([
      getReserve(id),
      getReserveBalance(id),
      listReserveEntries(id),
    ]);
    if (reserve) {
      setNome(reserve.nome);
      setTaxaText(
        reserve.taxaRendimentoMensalPercentual != null
          ? String(reserve.taxaRendimentoMensalPercentual)
          : '',
      );
    }
    setBalance(balanceValue);
    setEntries(entryList);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isNew) return;
      setLoading(true);
      loadExisting(reserveId).finally(() => setLoading(false));
    }, [isNew, reserveId, loadExisting]),
  );

  const canSave = nome.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const taxa = taxaText.trim() === '' ? undefined : Number(taxaText.replace(',', '.'));

    if (savedId) {
      await updateReserve(savedId, {
        nome: nome.trim(),
        taxaRendimentoMensalPercentual: taxa ?? null,
      });
      setSaving(false);
      router.back();
      return;
    }

    const reserve = await createReserve({
      nome: nome.trim(),
      taxaRendimentoMensalPercentual: taxa,
    });
    // Fica na tela (agora em modo edição) pra já poder lançar depósitos/retiradas.
    setSavedId(reserve.id);
    setSaving(false);
  };

  const handleAddEntry = async () => {
    if (!savedId || novoValor === undefined) return;
    setAddingEntry(true);
    await createReserveEntry({
      reservaId: savedId,
      tipo: novoTipo,
      valor: novoValor,
      data: novaData,
      observacao: novaObservacao || undefined,
    });
    setNovoValor(undefined);
    setNovaObservacao('');
    await loadExisting(savedId);
    setAddingEntry(false);
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
          {isNew ? 'Nova reserva' : nome || 'Reserva'}
        </Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
        {savedId && (
          <YStack
            backgroundColor="$surface"
            borderColor="$border"
            borderWidth={1}
            borderRadius="$lg"
            padding={22}
            gap="$1"
          >
            <Text fontSize={13} color="$textSecondary">
              Saldo atual
            </Text>
            <Money cents={balance} fontSize={32} fontWeight="600" color="$text" />
          </YStack>
        )}

        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Nome
          </Text>
          <AppInput value={nome} onChangeText={setNome} placeholder="Ex.: Reserva de emergência" />
        </YStack>

        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Taxa de rendimento mensal (%, opcional)
          </Text>
          <AppInput
            value={taxaText}
            onChangeText={setTaxaText}
            placeholder="Ex.: 1,5"
            keyboardType="decimal-pad"
          />
          <Text fontSize={12} color="$textTertiary">
            Só cadastro — não é aplicada automaticamente ao saldo.
          </Text>
        </YStack>

        <PrimaryButton
          onPress={handleSave}
          disabled={!canSave || saving}
          opacity={canSave ? 1 : 0.5}
          color="white"
          fontWeight="700"
          borderRadius={999}
        >
          {isNew ? 'Criar reserva' : 'Salvar alterações'}
        </PrimaryButton>

        {savedId && (
          <>
            <YStack
              backgroundColor="$surface"
              borderColor="$border"
              borderWidth={1}
              borderRadius="$lg"
              padding={18}
              gap="$3"
            >
              <Text fontSize={12} fontWeight="700" color="$textTertiary" textTransform="uppercase">
                Novo lançamento
              </Text>

              <XStack gap="$2">
                {(Object.keys(TIPO_LABELS) as LancamentoTipo[]).map((tipo) => (
                  <Button
                    key={tipo}
                    flex={1}
                    size="$3"
                    onPress={() => setNovoTipo(tipo)}
                    backgroundColor={novoTipo === tipo ? '$primary' : '$surface'}
                    color={novoTipo === tipo ? 'white' : '$text'}
                    borderColor="$border"
                    borderWidth={1}
                    fontWeight="700"
                  >
                    {TIPO_LABELS[tipo]}
                  </Button>
                ))}
              </XStack>

              <XStack gap="$3">
                <YStack flex={1} gap="$2">
                  <Text fontSize={13} color="$textSecondary">
                    Valor
                  </Text>
                  <MoneyInput value={novoValor} onChangeValue={setNovoValor} />
                </YStack>
                <YStack flex={1} gap="$2">
                  <Text fontSize={13} color="$textSecondary">
                    Data
                  </Text>
                  <DateField value={novaData} onChangeValue={setNovaData} />
                </YStack>
              </XStack>

              <AppInput
                value={novaObservacao}
                onChangeText={setNovaObservacao}
                placeholder="Observação (opcional)"
              />

              <Button
                onPress={handleAddEntry}
                disabled={novoValor === undefined || addingEntry}
                opacity={novoValor === undefined ? 0.5 : 1}
                backgroundColor="$surface"
                borderColor="$primary"
                borderWidth={1.5}
                color="$primaryDark"
                fontWeight="700"
              >
                Lançar
              </Button>
            </YStack>

            <YStack gap="$2">
              <Text fontSize={15} fontWeight="600" color="$text">
                Extrato
              </Text>
              {entries.length === 0 ? (
                <Text fontSize={13} color="$textSecondary">
                  Nenhum lançamento ainda.
                </Text>
              ) : (
                entries.map((entry, index) => (
                  <XStack
                    key={entry.id}
                    paddingVertical={12}
                    borderTopWidth={index === 0 ? 0 : 1}
                    borderColor="$border"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <YStack>
                      <Text fontSize={14} fontWeight="600" color="$text">
                        {TIPO_LABELS[entry.tipo as LancamentoTipo] ?? entry.tipo}
                      </Text>
                      <Text fontSize={12} color="$textTertiary">
                        {entry.data.getDate()}/{entry.data.getMonth() + 1}/
                        {entry.data.getFullYear()}
                        {entry.observacao ? ` · ${entry.observacao}` : ''}
                      </Text>
                    </YStack>
                    <Money
                      cents={entry.valor}
                      fontSize={14.5}
                      fontWeight="600"
                      color={entry.valor < 0 ? '$error' : '$success'}
                    />
                  </XStack>
                ))
              )}
            </YStack>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
