import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { Screen } from '@/components/Screen';
import {
  type CsvFormat,
  importCsv,
  pickCsvFile,
  type PickedCsvFile,
} from '@/repositories/csvImportRepository';
import { useCards } from '@/hooks/useCards';

const FORMAT_HELP: Record<CsvFormat, string> = {
  GENERICO: 'Cabeçalho "data;valor;descricao", separado por ";" — formato próprio do app.',
  NUBANK: 'Extrato exportado direto do app do Nubank ("date,title,amount").',
};

export default function ImportarCsvScreen() {
  const router = useRouter();
  const { cards } = useCards();
  const [cartaoId, setCartaoId] = useState<string | undefined>(undefined);
  const [formato, setFormato] = useState<CsvFormat>('GENERICO');
  const [pickedFile, setPickedFile] = useState<PickedCsvFile | null>(null);
  const [importing, setImporting] = useState(false);

  const handlePickFile = async () => {
    try {
      const file = await pickCsvFile();
      if (file) setPickedFile(file);
    } catch (error) {
      Alert.alert('Erro ao selecionar arquivo', (error as Error).message);
    }
  };

  const handleImport = async () => {
    if (!cartaoId || !pickedFile) return;
    setImporting(true);
    try {
      const result = await importCsv(cartaoId, formato, pickedFile.name, pickedFile.text);
      router.replace({
        pathname: '/cartoes/importar-csv/resultado',
        params: {
          totalLinhas: String(result.totalLinhas),
          linhasImportadas: String(result.linhasImportadas),
          linhasIgnoradas: String(result.linhasIgnoradas),
          skipped: JSON.stringify(result.skipped),
        },
      });
    } catch (error) {
      Alert.alert('Erro ao importar', (error as Error).message);
      setImporting(false);
    }
  };

  const canImport = Boolean(cartaoId && pickedFile) && !importing;

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
          Importar fatura via CSV
        </Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Cartão de destino
          </Text>
          {cards.length === 0 ? (
            <Text fontSize={13} color="$textTertiary">
              Cadastre um cartão antes de importar.
            </Text>
          ) : (
            <XStack flexWrap="wrap" gap="$2">
              {cards.map((card) => (
                <Button
                  key={card.id}
                  onPress={() => setCartaoId(card.id)}
                  size="$3"
                  backgroundColor={cartaoId === card.id ? '$primary' : '$surface'}
                  color={cartaoId === card.id ? 'white' : '$text'}
                  borderColor="$border"
                  borderWidth={1}
                >
                  {card.nome}
                </Button>
              ))}
            </XStack>
          )}
        </YStack>

        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Formato do arquivo
          </Text>
          <XStack gap="$2">
            <Button
              flex={1}
              onPress={() => setFormato('GENERICO')}
              backgroundColor={formato === 'GENERICO' ? '$primary' : '$surface'}
              color={formato === 'GENERICO' ? 'white' : '$text'}
              borderColor="$border"
              borderWidth={1}
              fontWeight="700"
            >
              Genérico
            </Button>
            <Button
              flex={1}
              onPress={() => setFormato('NUBANK')}
              backgroundColor={formato === 'NUBANK' ? '$primary' : '$surface'}
              color={formato === 'NUBANK' ? 'white' : '$text'}
              borderColor="$border"
              borderWidth={1}
              fontWeight="700"
            >
              Nubank
            </Button>
          </XStack>
          <Text fontSize={12} color="$textTertiary">
            {FORMAT_HELP[formato]}
          </Text>
        </YStack>

        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Arquivo
          </Text>
          <Button
            onPress={handlePickFile}
            backgroundColor="$surface"
            borderColor="$border"
            borderWidth={1}
            color="$text"
            fontWeight="600"
            justifyContent="flex-start"
          >
            {pickedFile ? pickedFile.name : 'Selecionar arquivo CSV'}
          </Button>
        </YStack>

        <Button
          onPress={handleImport}
          disabled={!canImport}
          opacity={canImport ? 1 : 0.5}
          backgroundColor="$primary"
          color="white"
          fontWeight="700"
          borderRadius={999}
        >
          {importing ? <ActivityIndicator color="white" /> : 'Importar'}
        </Button>
      </ScrollView>
    </Screen>
  );
}
