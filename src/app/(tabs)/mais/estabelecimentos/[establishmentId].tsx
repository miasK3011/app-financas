import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as LucideIcons from 'lucide-react-native';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { AppInput } from '@/components/AppInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { CATEGORY_ICON_OPTIONS, getIconColors } from '@/domain/shared/categoryIcons';
import {
  addPattern,
  createEstablishment,
  deletePattern,
  fetchAndCacheLogo,
  getEstablishment,
  listPatternsForEstablishment,
  type RecognitionPattern,
  updateEstablishment,
} from '@/repositories/establishmentsRepository';

type IconProps = { size?: number; color?: string };
const icons = LucideIcons as unknown as Record<string, ComponentType<IconProps>>;

/**
 * T119: reutilizada para criar (`establishmentId === 'novo'`) e editar
 * um Estabelecimento existente. Padrões só podem ser adicionados/
 * removidos depois de o Estabelecimento existir (após o primeiro
 * salvamento no modo criação).
 */
export default function EstabelecimentoDetalheScreen() {
  const router = useRouter();
  const { establishmentId } = useLocalSearchParams<{ establishmentId: string }>();
  const isNew = establishmentId === 'novo';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [nomeExibicao, setNomeExibicao] = useState('');
  const [iconeRespaldo, setIconeRespaldo] = useState<string>(CATEGORY_ICON_OPTIONS[0]);
  const [dominio, setDominio] = useState('');
  const [patterns, setPatterns] = useState<RecognitionPattern[]>([]);
  const [newPatternText, setNewPatternText] = useState('');
  const [savedId, setSavedId] = useState<string | null>(isNew ? null : establishmentId);

  useFocusEffect(
    useCallback(() => {
      if (isNew) return;
      setLoading(true);
      Promise.all([
        getEstablishment(establishmentId),
        listPatternsForEstablishment(establishmentId),
      ]).then(([establishment, patternList]) => {
        if (establishment) {
          setNomeExibicao(establishment.nomeExibicao);
          setIconeRespaldo(establishment.iconeRespaldo);
          setDominio(establishment.dominio ?? '');
        }
        setPatterns(patternList);
        setLoading(false);
      });
    }, [isNew, establishmentId]),
  );

  const canSave = nomeExibicao.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);

    if (savedId) {
      await updateEstablishment(savedId, {
        nomeExibicao: nomeExibicao.trim(),
        iconeRespaldo,
        dominio: dominio.trim() || null,
      });
      if (dominio.trim()) {
        fetchAndCacheLogo(savedId, dominio.trim()).catch(() => {});
      }
      setSaving(false);
      router.back();
      return;
    }

    const establishment = await createEstablishment({
      nomeExibicao: nomeExibicao.trim(),
      iconeRespaldo,
      dominio: dominio.trim() || undefined,
    });
    if (dominio.trim()) {
      fetchAndCacheLogo(establishment.id, dominio.trim()).catch(() => {});
    }
    // Fica na tela (agora em modo edição) em vez de voltar — assim dá
    // pra adicionar padrões de reconhecimento na sequência, sem
    // precisar reabrir o estabelecimento recém-criado pela lista.
    setSavedId(establishment.id);
    setSaving(false);
  };

  const handleAddPattern = async () => {
    const texto = newPatternText.trim();
    if (!texto || !savedId) return;
    const pattern = await addPattern(savedId, texto);
    setPatterns((current) => [...current, pattern]);
    setNewPatternText('');
  };

  const handleDeletePattern = async (patternId: string) => {
    await deletePattern(patternId);
    setPatterns((current) => current.filter((pattern) => pattern.id !== patternId));
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
          {isNew ? 'Novo estabelecimento' : 'Editar estabelecimento'}
        </Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Nome
          </Text>
          <AppInput value={nomeExibicao} onChangeText={setNomeExibicao} placeholder="Ex.: iFood" />
        </YStack>

        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Ícone de respaldo
          </Text>
          <XStack flexWrap="wrap" gap="$2">
            {CATEGORY_ICON_OPTIONS.map((iconName) => {
              const Icon = icons[iconName];
              const selected = iconeRespaldo === iconName;
              const { bg, fg } = getIconColors(iconName);
              return (
                <Button
                  key={iconName}
                  onPress={() => setIconeRespaldo(iconName)}
                  width={48}
                  height={48}
                  circular
                  backgroundColor={bg}
                  borderColor={selected ? '$primary' : 'transparent'}
                  borderWidth={2}
                  icon={<Icon size={20} color={fg} />}
                />
              );
            })}
          </XStack>
        </YStack>

        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Domínio (opcional, para buscar o logotipo)
          </Text>
          <AppInput value={dominio} onChangeText={setDominio} placeholder="Ex.: ifood.com.br" />
        </YStack>

        <PrimaryButton
          onPress={handleSave}
          disabled={!canSave || saving}
          opacity={canSave ? 1 : 0.5}
          color="white"
          fontWeight="700"
          borderRadius={999}
        >
          {isNew ? 'Criar estabelecimento' : 'Salvar alterações'}
        </PrimaryButton>

        {savedId && (
          <YStack gap="$2">
            <Text fontSize={15} fontWeight="600" color="$text">
              Padrões de reconhecimento
            </Text>
            <Text fontSize={12} color="$textTertiary">
              Toda compra cuja descrição contenha um destes textos ganha este estabelecimento
              automaticamente.
            </Text>

            {patterns.map((pattern, index) => (
              <XStack
                key={pattern.id}
                paddingVertical={10}
                borderTopWidth={index === 0 ? 0 : 1}
                borderColor="$border"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text fontSize={14} color="$text">
                  {pattern.texto}
                </Text>
                <Button
                  onPress={() => handleDeletePattern(pattern.id)}
                  size="$2"
                  circular
                  chromeless
                  icon={<Trash2 size={16} color="#C74A3C" />}
                />
              </XStack>
            ))}

            <XStack gap="$2" alignItems="center">
              <AppInput
                flex={1}
                value={newPatternText}
                onChangeText={setNewPatternText}
                placeholder="Ex.: IFOOD"
              />
              <PrimaryButton onPress={handleAddPattern} color="white" fontWeight="700">
                Adicionar
              </PrimaryButton>
            </XStack>
          </YStack>
        )}
      </ScrollView>
    </Screen>
  );
}
