import { useLocalSearchParams, useRouter } from 'expo-router';
import * as LucideIcons from 'lucide-react-native';
import { ChevronLeft, Plus } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { AppInput } from '@/components/AppInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { TransactionAvatar } from '@/components/TransactionAvatar';
import { CATEGORY_ICON_OPTIONS, getIconColors } from '@/domain/shared/categoryIcons';
import { suggestInitialPattern } from '@/domain/establishmentMatching/suggestInitialPattern';
import {
  addPattern,
  createEstablishment,
  type Establishment,
  listEstablishments,
} from '@/repositories/establishmentsRepository';

type IconProps = { size?: number; color?: string };
const icons = LucideIcons as unknown as Record<string, ComponentType<IconProps>>;

/**
 * T120/NovaCompraEstabelecimento.dc.html: escolher um Estabelecimento
 * já cadastrado, ou criar um novo inline a partir da descrição já
 * digitada em Nova Compra (FR-032) — sugestão de padrão inicial via
 * `suggestInitialPattern`, sempre editável antes de confirmar.
 */
export default function NovaCompraEstabelecimentoScreen() {
  const router = useRouter();
  // Reaproveitada por Editar Compra (`[compraId].tsx`) — `returnTo`
  // distingue pra qual tela `dismissTo`, já que os dois fluxos usam este
  // mesmo picker (issue #5: "era pra ser parecida com a de Nova Compra").
  const { descricao, returnTo, compraId } = useLocalSearchParams<{
    descricao?: string;
    returnTo?: string;
    compraId?: string;
  }>();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [nome, setNome] = useState('');
  const [iconeRespaldo, setIconeRespaldo] = useState<string>(CATEGORY_ICON_OPTIONS[0]);
  const [patternText, setPatternText] = useState('');

  useEffect(() => {
    listEstablishments().then((rows) => {
      setEstablishments(rows);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (creating && descricao) {
      setNome(suggestInitialPattern(descricao));
      setPatternText(suggestInitialPattern(descricao));
    }
  }, [creating, descricao]);

  const handleSelect = (establishment: Establishment) => {
    if (returnTo === 'editar-compra' && compraId) {
      router.dismissTo({
        pathname: '/cartoes/compra/[compraId]',
        params: { compraId, estabelecimentoId: establishment.id },
      });
      return;
    }
    router.dismissTo({
      pathname: '/cartoes/nova-compra',
      params: {
        estabelecimentoId: establishment.id,
        estabelecimentoNome: establishment.nomeExibicao,
      },
    });
  };

  const handleCreate = async () => {
    if (!nome.trim()) return;
    const establishment = await createEstablishment({
      nomeExibicao: nome.trim(),
      iconeRespaldo,
    });
    if (patternText.trim()) {
      await addPattern(establishment.id, patternText.trim());
    }
    handleSelect(establishment);
  };

  if (creating) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <XStack alignItems="center" gap="$3" padding={20} paddingBottom={0}>
          <Button
            onPress={() => setCreating(false)}
            circular
            size="$3"
            backgroundColor="$surface"
            borderColor="$border"
            borderWidth={1}
            icon={<ChevronLeft size={18} />}
          />
          <Text fontFamily="$heading" fontSize={18} fontWeight="600" color="$text">
            Novo estabelecimento
          </Text>
        </XStack>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
          <YStack gap="$2">
            <Text fontSize={13} color="$textSecondary">
              Nome
            </Text>
            <AppInput value={nome} onChangeText={setNome} placeholder="Ex.: iFood" />
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
              Padrão de reconhecimento
            </Text>
            <AppInput value={patternText} onChangeText={setPatternText} placeholder="Ex.: IFOOD" />
            <Text fontSize={12} color="$textTertiary">
              Sugerido a partir da descrição da compra — edite se quiser reconhecer um texto
              diferente.
            </Text>
          </YStack>

          <PrimaryButton
            onPress={handleCreate}
            disabled={!nome.trim()}
            opacity={nome.trim() ? 1 : 0.5}
            color="white"
            fontWeight="700"
            borderRadius={999}
          >
            Criar e usar
          </PrimaryButton>
        </ScrollView>
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
          Estabelecimento
        </Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          establishments.map((establishment, index) => (
            <XStack
              key={establishment.id}
              paddingVertical={14}
              borderTopWidth={index === 0 ? 0 : 1}
              borderColor="$border"
              alignItems="center"
              gap="$3"
              onPress={() => handleSelect(establishment)}
            >
              <TransactionAvatar
                estabelecimento={{
                  logoCachePath: establishment.logoCachePath,
                  iconeRespaldo: establishment.iconeRespaldo,
                }}
              />
              <Text fontSize={15} fontWeight="600" color="$text">
                {establishment.nomeExibicao}
              </Text>
            </XStack>
          ))
        )}
      </ScrollView>

      <Button
        onPress={() => setCreating(true)}
        backgroundColor="$primaryLight"
        borderColor="$primary"
        borderWidth={1.5}
        borderStyle="dashed"
        color="$primaryDark"
        fontWeight="700"
        margin={20}
        icon={<Plus size={16} color="#234F3E" />}
      >
        Criar novo estabelecimento
      </Button>
    </Screen>
  );
}
