import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Text, YStack } from 'tamagui';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import {
  exportBackupToFile,
  pickBackupFileUri,
  readAndValidateBackupFile,
} from '@/repositories/backupRepository';

export default function BackupScreen() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportBackupToFile();
    } catch (error) {
      Alert.alert('Não foi possível exportar', (error as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const uri = await pickBackupFileUri();
      if (!uri) return; // usuário cancelou

      const result = await readAndValidateBackupFile(uri);
      if (!result.valid) {
        Alert.alert('Arquivo de backup inválido', result.reason);
        return;
      }

      router.push({ pathname: '/mais/backup/confirmar-restauracao', params: { uri } });
    } catch (error) {
      Alert.alert('Não foi possível importar', (error as Error).message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Screen>
      <YStack alignItems="center" flexDirection="row" gap="$3" padding={20} paddingBottom={0}>
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
          Backup
        </Text>
      </YStack>

      <YStack padding={20} gap="$4">
        <YStack
          backgroundColor="$surface"
          borderColor="$border"
          borderWidth={1}
          borderRadius="$lg"
          padding={22}
          gap="$2"
        >
          <Text fontSize={15} fontWeight="600" color="$text">
            Exportar backup
          </Text>
          <Text fontSize={13} color="$textSecondary">
            Gera um arquivo com todos os seus dados (cartões, faturas, compras, assinaturas,
            reservas e renda) para você salvar onde quiser.
          </Text>
          <PrimaryButton
            onPress={handleExport}
            disabled={exporting}
            color="white"
            fontWeight="700"
            borderRadius={999}
            marginTop="$2"
          >
            {exporting ? 'Exportando…' : 'Exportar'}
          </PrimaryButton>
        </YStack>

        <YStack
          backgroundColor="$surface"
          borderColor="$border"
          borderWidth={1}
          borderRadius="$lg"
          padding={22}
          gap="$2"
        >
          <Text fontSize={15} fontWeight="600" color="$text">
            Importar backup
          </Text>
          <Text fontSize={13} color="$textSecondary">
            Restaura dados de um arquivo de backup exportado anteriormente. Isso substitui
            integralmente os dados atuais deste aparelho.
          </Text>
          <Button
            onPress={handleImport}
            disabled={importing}
            backgroundColor="$surface"
            borderColor="$error"
            borderWidth={1}
            color="$error"
            fontWeight="700"
            borderRadius={999}
            marginTop="$2"
          >
            {importing ? 'Lendo arquivo…' : 'Importar'}
          </Button>
        </YStack>
      </YStack>
    </Screen>
  );
}
