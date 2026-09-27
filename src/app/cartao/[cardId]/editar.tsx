import { useLocalSearchParams, useRouter } from 'expo-router';
import { Archive, ArchiveRestore, ChevronLeft, Trash2 } from 'lucide-react-native';
import { ActivityIndicator, Alert } from 'react-native';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { CardForm } from '@/components/CardForm';
import { Screen } from '@/components/Screen';
import { useCard } from '@/hooks/useCards';
import {
  archiveCard,
  deleteCard,
  getCardDeletionImpact,
  unarchiveCard,
  updateCard,
} from '@/repositories/cardsRepository';

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/**
 * Editar cartão (issue #16): nome, dias e regra de compra no dia do
 * fechamento — `updateCard` realoca as parcelas das faturas não pagas
 * se os dias/regra mudarem. Também concentra arquivar/desarquivar e a
 * exclusão definitiva do cartão.
 */
export default function EditarCartaoScreen() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const router = useRouter();
  const { card, loading } = useCard(cardId);

  if (loading || !card) {
    return (
      <Screen>
        <YStack flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator />
        </YStack>
      </Screen>
    );
  }

  const handleArchiveToggle = () => {
    if (card.arquivadoEm) {
      unarchiveCard(card.id).then(() => router.back());
      return;
    }
    Alert.alert(
      'Arquivar cartão',
      'O cartão sai das opções de nova compra, mas o histórico é mantido.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Arquivar',
          style: 'destructive',
          onPress: async () => {
            await archiveCard(card.id);
            router.back();
          },
        },
      ],
    );
  };

  const handleDelete = async () => {
    const impact = await getCardDeletionImpact(card.id);
    const details = [
      `Apaga ${plural(impact.compras, 'compra', 'compras')} e ${plural(impact.faturas, 'fatura', 'faturas')} deste cartão.`,
      impact.assinaturasAtivas > 0
        ? `${plural(impact.assinaturasAtivas, 'assinatura ativa será cancelada', 'assinaturas ativas serão canceladas')}.`
        : null,
      'Isso não pode ser desfeito.',
    ]
      .filter(Boolean)
      .join('\n\n');

    Alert.alert(`Excluir ${card.nome}?`, details, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteCard(card.id);
          // Fecha esta tela e o detalhe do cartão, que não existe mais.
          router.dismiss(2);
        },
      },
    ]);
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
        <Text fontFamily="$heading" fontSize={19} fontWeight="600" color="$text">
          Editar cartão
        </Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 28 }}>
        <CardForm
          initialValues={{
            nome: card.nome,
            diaFechamento: card.diaFechamento,
            diaVencimento: card.diaVencimento,
            compraNoFechamentoVaiParaProxima: card.compraNoFechamentoVaiParaProxima,
          }}
          submitLabel="Salvar alterações"
          onSubmit={async (data) => {
            await updateCard(card.id, data);
            router.back();
          }}
        />

        <YStack borderTopWidth={1} borderColor="$border" paddingTop="$3" gap="$1">
          <Button
            onPress={handleArchiveToggle}
            chromeless
            justifyContent="flex-start"
            color="$text"
            fontWeight="600"
            icon={card.arquivadoEm ? <ArchiveRestore size={17} /> : <Archive size={17} />}
          >
            {card.arquivadoEm ? 'Desarquivar cartão' : 'Arquivar cartão'}
          </Button>
          <Button
            onPress={handleDelete}
            chromeless
            justifyContent="flex-start"
            color="$error"
            fontWeight="600"
            icon={<Trash2 size={17} color="#C74A3C" />}
          >
            Excluir cartão
          </Button>
        </YStack>
      </ScrollView>
    </Screen>
  );
}
