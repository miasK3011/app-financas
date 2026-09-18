import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as LucideIcons from 'lucide-react-native';
import { ChevronLeft, Shapes } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { AppInput } from '@/components/AppInput';
import { MoneyInput } from '@/components/MoneyInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { type Category, listCategories } from '@/repositories/categoriesRepository';
import { useCards } from '@/hooks/useCards';
import {
  cancelSubscription,
  createSubscription,
  getSubscription,
  listTagsForSubscription,
  setSubscriptionTags,
  updateSubscription,
} from '@/repositories/subscriptionsRepository';

type IconProps = { size?: number; color?: string };
const icons = LucideIcons as unknown as Record<string, ComponentType<IconProps>>;

/**
 * T089: reutilizada para criar (`subscriptionId === 'nova'`, sem
 * Assinatura pré-existente para carregar) e para editar uma já
 * existente. Nunca reescreve Compras já geradas (FR-017 Edge Case) —
 * `updateSubscription` só muda a configuração vigente da Assinatura.
 */
export default function AssinaturaEditarScreen() {
  const router = useRouter();
  const { subscriptionId } = useLocalSearchParams<{ subscriptionId: string }>();
  const isNew = subscriptionId === 'nova';
  const { cards } = useCards();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [nome, setNome] = useState('');
  const [valor, setValor] = useState<number | undefined>(undefined);
  const [formaPagamento, setFormaPagamento] = useState<'PIX' | 'CARTAO'>('PIX');
  const [cartaoId, setCartaoId] = useState<string | undefined>(undefined);
  const [diaCobranca, setDiaCobranca] = useState<number | undefined>(undefined);
  const [categoriaId, setCategoriaId] = useState<string | undefined>(undefined);
  const [tagsText, setTagsText] = useState('');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const categoryList = await listCategories();
        setCategories(categoryList);

        if (isNew) {
          setLoading(false);
          return;
        }

        setLoading(true);
        const [subscription, tagNomes] = await Promise.all([
          getSubscription(subscriptionId),
          listTagsForSubscription(subscriptionId),
        ]);
        if (subscription) {
          setNome(subscription.nome);
          setValor(subscription.valor);
          setFormaPagamento(subscription.formaPagamento);
          setCartaoId(subscription.cartaoId ?? undefined);
          setDiaCobranca(subscription.diaCobranca);
          setCategoriaId(subscription.categoriaId ?? undefined);
        }
        setTagsText(tagNomes.join(', '));
        setLoading(false);
      })();
    }, [isNew, subscriptionId]),
  );

  const canSave =
    nome.trim().length > 0 &&
    valor !== undefined &&
    valor > 0 &&
    diaCobranca !== undefined &&
    (formaPagamento === 'PIX' || Boolean(cartaoId));

  const handleSave = async () => {
    if (!canSave || valor === undefined || diaCobranca === undefined) return;
    setSaving(true);
    const tagNomes = tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (isNew) {
      await createSubscription({
        nome: nome.trim(),
        valor,
        formaPagamento,
        cartaoId: formaPagamento === 'CARTAO' ? cartaoId : undefined,
        diaCobranca,
        categoriaId,
        tagNomes,
      });
    } else {
      await updateSubscription(subscriptionId, {
        nome: nome.trim(),
        valor,
        formaPagamento,
        cartaoId: formaPagamento === 'CARTAO' ? (cartaoId ?? null) : null,
        diaCobranca,
        categoriaId: categoriaId ?? null,
      });
      await setSubscriptionTags(subscriptionId, tagNomes);
    }

    setSaving(false);
    router.back();
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancelar assinatura',
      'Nenhuma cobrança futura será gerada. O histórico de compras já geradas é mantido.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar assinatura',
          style: 'destructive',
          onPress: async () => {
            await cancelSubscription(subscriptionId);
            router.back();
          },
        },
      ],
    );
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
          {isNew ? 'Nova assinatura' : 'Editar assinatura'}
        </Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Nome
          </Text>
          <AppInput value={nome} onChangeText={setNome} placeholder="Ex.: Netflix" />
        </YStack>

        <XStack gap="$3">
          <YStack flex={1} gap="$2">
            <Text fontSize={13} color="$textSecondary">
              Valor (R$)
            </Text>
            <MoneyInput value={valor} onChangeValue={setValor} />
          </YStack>

          <YStack flex={1} gap="$2">
            <Text fontSize={13} color="$textSecondary">
              Dia de cobrança
            </Text>
            <AppInput
              value={diaCobranca === undefined ? '' : String(diaCobranca)}
              onChangeText={(text) => {
                const digits = text.replace(/\D/g, '');
                if (digits === '') {
                  setDiaCobranca(undefined);
                  return;
                }
                setDiaCobranca(Math.min(31, Number(digits)));
              }}
              placeholder="Ex.: 15"
              keyboardType="number-pad"
            />
          </YStack>
        </XStack>

        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Forma de pagamento
          </Text>
          <XStack gap="$2">
            <Button
              flex={1}
              onPress={() => setFormaPagamento('PIX')}
              backgroundColor={formaPagamento === 'PIX' ? '$primary' : '$surface'}
              color={formaPagamento === 'PIX' ? 'white' : '$text'}
              borderColor="$border"
              borderWidth={1}
              fontWeight="700"
            >
              Pix
            </Button>
            <Button
              flex={1}
              onPress={() => setFormaPagamento('CARTAO')}
              backgroundColor={formaPagamento === 'CARTAO' ? '$primary' : '$surface'}
              color={formaPagamento === 'CARTAO' ? 'white' : '$text'}
              borderColor="$border"
              borderWidth={1}
              fontWeight="700"
            >
              Cartão
            </Button>
          </XStack>
        </YStack>

        {formaPagamento === 'CARTAO' && (
          <YStack gap="$2">
            <Text fontSize={13} color="$textSecondary">
              Cartão
            </Text>
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
          </YStack>
        )}

        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Categoria
          </Text>
          <XStack flexWrap="wrap" gap="$2">
            {categories.map((category) => {
              const Icon = icons[category.icone] ?? Shapes;
              const selected = categoriaId === category.id;
              return (
                <Button
                  key={category.id}
                  onPress={() => setCategoriaId(selected ? undefined : category.id)}
                  size="$3"
                  backgroundColor={selected ? '$primary' : '$surface'}
                  color={selected ? 'white' : '$text'}
                  borderColor="$border"
                  borderWidth={1}
                  icon={<Icon size={16} color={selected ? 'white' : '#1C1C1E'} />}
                >
                  {category.nome}
                </Button>
              );
            })}
          </XStack>
        </YStack>

        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Tags (separadas por vírgula)
          </Text>
          <AppInput
            value={tagsText}
            onChangeText={setTagsText}
            placeholder="Ex.: Lazer, Trabalho"
          />
        </YStack>

        <PrimaryButton
          onPress={handleSave}
          disabled={!canSave || saving}
          opacity={canSave ? 1 : 0.5}
          color="white"
          fontWeight="700"
          borderRadius={999}
        >
          {isNew ? 'Criar assinatura' : 'Salvar alterações'}
        </PrimaryButton>

        {!isNew && (
          <Button
            onPress={handleCancelSubscription}
            backgroundColor="$errorBg"
            color="$errorDark"
            fontWeight="700"
            borderRadius={999}
          >
            Cancelar assinatura
          </Button>
        )}
      </ScrollView>
    </Screen>
  );
}
