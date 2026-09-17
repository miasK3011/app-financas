import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, ChevronLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { Screen } from '@/components/Screen';
import type { BackupFile } from '@/domain/backup/serializeBackup';
import { readAndValidateBackupFile, restoreAll } from '@/repositories/backupRepository';

export default function BackupConfirmarScreen() {
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const [file, setFile] = useState<BackupFile>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!uri) return;
    readAndValidateBackupFile(uri).then((result) => {
      if (result.valid) {
        setFile(result.file);
      } else {
        setError(result.reason);
      }
      setLoading(false);
    });
  }, [uri]);

  const handleConfirm = () => {
    if (!file) return;
    Alert.alert(
      'Tem certeza?',
      'Todos os dados atuais deste aparelho serão substituídos pelo conteúdo do backup. Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: async () => {
            setRestoring(true);
            try {
              await restoreAll(file);
              Alert.alert('Backup restaurado', 'Seus dados foram substituídos com sucesso.', [
                { text: 'OK', onPress: () => router.dismissTo('/mais/backup') },
              ]);
            } catch (restoreError) {
              Alert.alert('Falha ao restaurar', (restoreError as Error).message);
              setRestoring(false);
            }
          },
        },
      ],
    );
  };

  const counts = file
    ? [
        { label: 'Cartões', value: file.data.cartoes.length },
        { label: 'Faturas', value: file.data.faturas.length },
        { label: 'Compras', value: file.data.compras.length },
        { label: 'Assinaturas', value: file.data.assinaturas.length },
        { label: 'Reservas', value: file.data.reservas.length },
      ]
    : [];

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
          Confirmar restauração
        </Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 22 }}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : error ? (
          <YStack alignItems="center" gap="$2" paddingTop={24}>
            <Text fontSize={15} fontWeight="600" color="$error" textAlign="center">
              {error}
            </Text>
          </YStack>
        ) : (
          <>
            <XStack
              backgroundColor="$errorBg"
              borderRadius="$lg"
              padding={16}
              gap="$3"
              alignItems="flex-start"
            >
              <AlertTriangle size={20} color="#9E3A2F" />
              <Text flex={1} fontSize={13} color="$errorDark">
                Isso substitui TODOS os dados atuais deste aparelho pelo conteúdo do arquivo. Não é
                possível desfazer depois de confirmado.
              </Text>
            </XStack>

            <YStack
              backgroundColor="$surface"
              borderColor="$border"
              borderWidth={1}
              borderRadius="$lg"
              padding={22}
              gap="$2"
            >
              <Text fontSize={13} color="$textSecondary">
                Este backup contém
              </Text>
              {counts.map((row) => (
                <XStack key={row.label} justifyContent="space-between">
                  <Text fontSize={14} color="$text">
                    {row.label}
                  </Text>
                  <Text fontSize={14} fontWeight="600" color="$text">
                    {row.value}
                  </Text>
                </XStack>
              ))}
            </YStack>

            <Button
              onPress={handleConfirm}
              disabled={restoring}
              backgroundColor="$error"
              color="white"
              fontWeight="700"
              borderRadius={999}
            >
              {restoring ? 'Restaurando…' : 'Restaurar backup'}
            </Button>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
