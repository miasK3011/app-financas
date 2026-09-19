import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Pencil, Plus, TrendingUp, Wallet } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { Money } from '@/components/Money';
import { MoneyInput } from '@/components/MoneyInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import {
  type CashEntryWithLinkedPurchase,
  deleteCashEntry,
  listCashEntriesForMonthWithLinkedPurchase,
} from '@/repositories/cashEntriesRepository';
import {
  type IncomeConfig,
  getIncomeForMonth,
  listIncomeHistory,
  setIncome,
} from '@/repositories/incomeConfigRepository';

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function formatDate(date: Date): string {
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${date.getFullYear()}`;
}

/** Rótulo de vigência de cada entrada do histórico, mais recente primeiro (MainHistorico.dc.html). */
function historyPeriodLabel(history: IncomeConfig[], index: number): string {
  const current = history[index];
  if (index === 0) return `Desde ${formatDate(current.vigenteDesde)}`;

  const previousStart = history[index - 1].vigenteDesde;
  const end = new Date(previousStart);
  end.setDate(end.getDate() - 1);

  if (index === history.length - 1) return `até ${formatDate(end)}`;
  return `${formatDate(current.vigenteDesde)} – ${formatDate(end)}`;
}

/**
 * Renda & Entradas · Main (Main.dc.html): card "Total de entradas" (renda
 * + avulsas, com breakdown e edição inline da renda), abas "Entradas
 * avulsas" (com navegação de mês) / "Histórico de renda" — issue #5,
 * segunda maior divergência de composição de tela.
 */
export default function RendaScreen() {
  const router = useRouter();
  const today = new Date();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [tab, setTab] = useState<'ENTRADAS' | 'HISTORICO'>('ENTRADAS');

  const [income, setIncomeState] = useState<IncomeConfig>();
  const [entries, setEntries] = useState<CashEntryWithLinkedPurchase[]>([]);
  const [history, setHistory] = useState<IncomeConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState<number | undefined>(undefined);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [incomeConfig, entryList, incomeHistory] = await Promise.all([
      getIncomeForMonth(viewYear, viewMonth),
      listCashEntriesForMonthWithLinkedPurchase(viewYear, viewMonth),
      listIncomeHistory(),
    ]);
    setIncomeState(incomeConfig);
    setEntries(entryList);
    setHistory(incomeHistory);
    setLoading(false);
  }, [viewYear, viewMonth]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const changeMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth - 1 + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth() + 1);
  };

  const avulsasTotal = entries.reduce((sum, entry) => sum + entry.valor, 0);
  const totalEntradas = (income?.valor ?? 0) + avulsasTotal;

  const handleSaveIncome = async () => {
    if (incomeInput !== undefined && incomeInput > 0) {
      await setIncome(incomeInput, new Date());
      await refresh();
    }
    setEditingIncome(false);
    setIncomeInput(undefined);
  };

  const handleRemoveEntry = async (id: string) => {
    await deleteCashEntry(id);
    await refresh();
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
        <YStack
          backgroundColor="$surface"
          borderColor="$border"
          borderWidth={1}
          borderRadius="$lg"
          padding={22}
          gap="$3"
        >
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize={13} fontWeight="500" color="$textSecondary">
              Total de entradas · {MONTH_NAMES[viewMonth - 1]} {viewYear}
            </Text>
            <Button
              onPress={() => {
                setIncomeInput(income?.valor);
                setEditingIncome(true);
              }}
              size="$2"
              circular
              backgroundColor="$surface"
              borderColor="$border"
              borderWidth={1}
              icon={<Pencil size={15} />}
            />
          </XStack>

          {editingIncome ? (
            <XStack gap="$2" alignItems="center">
              <MoneyInput flex={1} value={incomeInput} onChangeValue={setIncomeInput} autoFocus />
              <PrimaryButton onPress={handleSaveIncome} color="white" fontWeight="700">
                Salvar
              </PrimaryButton>
            </XStack>
          ) : (
            <>
              <Money
                cents={totalEntradas}
                fontFamily="$heading"
                fontSize={30}
                fontWeight="600"
                color="$primary"
              />
              <XStack gap="$2">
                <XStack
                  alignItems="center"
                  gap="$2"
                  backgroundColor="$bg"
                  borderColor="$border"
                  borderWidth={1}
                  borderRadius={999}
                  paddingVertical={6}
                  paddingHorizontal={12}
                >
                  <Wallet size={15} color="#6C6C6D" />
                  <Money
                    cents={income?.valor ?? 0}
                    fontSize={13}
                    fontWeight="600"
                    color="$textSecondary"
                  />
                </XStack>
                <XStack
                  alignItems="center"
                  gap="$2"
                  backgroundColor="$bg"
                  borderColor="$border"
                  borderWidth={1}
                  borderRadius={999}
                  paddingVertical={6}
                  paddingHorizontal={12}
                >
                  <TrendingUp size={15} color="#306E49" />
                  <Money
                    cents={avulsasTotal}
                    fontSize={13}
                    fontWeight="600"
                    color="$textSecondary"
                  />
                </XStack>
              </XStack>
            </>
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

        <SegmentedControl
          options={[
            { value: 'ENTRADAS', label: 'Entradas avulsas' },
            { value: 'HISTORICO', label: 'Histórico de renda' },
          ]}
          value={tab}
          onChange={setTab}
        />

        {loading ? (
          <ActivityIndicator style={{ marginTop: 12 }} />
        ) : tab === 'ENTRADAS' ? (
          <YStack gap="$2">
            <XStack alignItems="center" justifyContent="center" gap="$4">
              <Button
                onPress={() => changeMonth(-1)}
                circular
                size="$2"
                backgroundColor="$surface"
                borderColor="$border"
                borderWidth={1}
                icon={<ChevronLeft size={16} />}
              />
              <Text
                fontSize={14.5}
                fontWeight="700"
                color="$text"
                minWidth={132}
                textAlign="center"
              >
                {MONTH_NAMES[viewMonth - 1]} {viewYear}
              </Text>
              <Button
                onPress={() => changeMonth(1)}
                circular
                size="$2"
                backgroundColor="$surface"
                borderColor="$border"
                borderWidth={1}
                icon={<ChevronRight size={16} />}
              />
            </XStack>

            {entries.length === 0 ? (
              <YStack
                backgroundColor="$surface"
                borderColor="$border"
                borderWidth={1}
                borderRadius="$lg"
                padding={22}
                alignItems="center"
              >
                <Text fontSize={13} color="$textSecondary" textAlign="center">
                  Nenhuma entrada avulsa em {MONTH_NAMES[viewMonth - 1].toLowerCase()} de {viewYear}
                </Text>
              </YStack>
            ) : (
              <YStack>
                {entries.map((entry, index) => (
                  <XStack
                    key={entry.id}
                    paddingVertical={14}
                    borderTopWidth={index === 0 ? 0 : 1}
                    borderColor="$border"
                    alignItems="center"
                    gap="$3"
                  >
                    <XStack
                      width={38}
                      height={38}
                      borderRadius={19}
                      backgroundColor={entry.compraVinculadaId ? '$successBg' : '$primaryLight'}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <TrendingUp
                        size={18}
                        color={entry.compraVinculadaId ? '#306E49' : '#234F3E'}
                      />
                    </XStack>
                    <YStack flex={1}>
                      <Text fontSize={14.5} fontWeight="600" color="$text">
                        {entry.descricao}
                      </Text>
                      <Text fontSize={12.5} color="$textTertiary">
                        {formatDate(entry.data)}
                        {entry.compraVinculadaDescricao
                          ? ` · vinculada a ${entry.compraVinculadaDescricao}`
                          : ''}
                      </Text>
                    </YStack>
                    <XStack alignItems="center" gap="$2">
                      <Money cents={entry.valor} fontSize={15} fontWeight="600" color="$text" />
                      <Button
                        onPress={() => handleRemoveEntry(entry.id)}
                        size="$1"
                        chromeless
                        color="$error"
                        fontSize={12}
                        fontWeight="600"
                      >
                        Excluir
                      </Button>
                    </XStack>
                  </XStack>
                ))}
              </YStack>
            )}
          </YStack>
        ) : (
          <YStack>
            {history.length === 0 ? (
              <Text fontSize={13} color="$textSecondary">
                Nenhuma renda configurada ainda.
              </Text>
            ) : (
              history.map((entry, index) => (
                <XStack
                  key={entry.id}
                  paddingVertical={14}
                  borderTopWidth={index === 0 ? 0 : 1}
                  borderColor="$border"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <YStack>
                    <XStack alignItems="center" gap="$2">
                      <Money cents={entry.valor} fontSize={15} fontWeight="600" color="$text" />
                      {index === 0 && (
                        <XStack
                          backgroundColor="$successBg"
                          borderRadius={999}
                          paddingHorizontal={8}
                          paddingVertical={3}
                        >
                          <Text fontSize={11} fontWeight="700" color="$successDark">
                            Atual
                          </Text>
                        </XStack>
                      )}
                    </XStack>
                    <Text fontSize={12.5} color="$textTertiary" marginTop={2}>
                      {historyPeriodLabel(history, index)}
                    </Text>
                  </YStack>
                </XStack>
              ))
            )}
          </YStack>
        )}
      </ScrollView>

      <PrimaryButton
        onPress={() => router.push('/mais/renda/nova-entrada')}
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
