import type { ReactNode } from 'react';
import { Button, Text, XStack, YStack } from 'tamagui';

import { SegmentedControl } from '@/components/SegmentedControl';
import { Stepper } from '@/components/Stepper';
import { currentInstallmentNumber } from '@/domain/installments/currentInstallmentNumber';
import type { Card } from '@/repositories/cardsRepository';

type Props = {
  formaPagamento: 'PIX' | 'CARTAO';
  onChangeFormaPagamento: (next: 'PIX' | 'CARTAO') => void;
  cards: Card[];
  cartaoId: string | undefined;
  onChangeCartaoId: (next: string) => void;
  cartaoError?: boolean;
  parcelasTotal: number;
  onChangeParcelasTotal: (next: number) => void;
  /** Data da compra ORIGINAL — base da dica "Hoje na parcela X de N" (issue #18). */
  dataCompra: Date | undefined;
  /** Conteúdo extra logo abaixo da lista de cartões (ex.: banner "Melhor hoje"). */
  cardExtras?: ReactNode;
};

/**
 * Bloco "Pagamento" compartilhado por Nova compra e Editar compra
 * (issue #17): forma de pagamento, cartão e número de parcelas. Não há
 * mais "Parcela atual" (issue #18) — o usuário informa a data da compra
 * original e a dica mostra em qual parcela o parcelamento está hoje.
 */
export function PaymentFields({
  formaPagamento,
  onChangeFormaPagamento,
  cards,
  cartaoId,
  onChangeCartaoId,
  cartaoError,
  parcelasTotal,
  onChangeParcelasTotal,
  dataCompra,
  cardExtras,
}: Props) {
  const selectedCard = cards.find((card) => card.id === cartaoId);
  const current =
    selectedCard && dataCompra && parcelasTotal > 1
      ? currentInstallmentNumber(dataCompra, parcelasTotal, selectedCard, new Date())
      : null;

  return (
    <>
      <YStack gap="$2">
        <Text fontSize={13} color="$textSecondary">
          Forma de pagamento
        </Text>
        <SegmentedControl
          options={[
            { value: 'PIX', label: 'Pix' },
            { value: 'CARTAO', label: 'Cartão' },
          ]}
          value={formaPagamento}
          onChange={onChangeFormaPagamento}
        />
      </YStack>

      {formaPagamento === 'CARTAO' && (
        <>
          <YStack gap="$2">
            <Text fontSize={13} color="$textSecondary">
              Cartão
            </Text>
            <XStack flexWrap="wrap" gap="$2">
              {cards.map((card) => (
                <Button
                  key={card.id}
                  onPress={() => onChangeCartaoId(card.id)}
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
            {cartaoError && (
              <Text fontSize={12} color="$error">
                Selecione um cartão
              </Text>
            )}
            {cardExtras}
          </YStack>

          <YStack gap="$2">
            <Text fontSize={13} color="$textSecondary">
              Parcelas
            </Text>
            <Stepper value={parcelasTotal} onChangeValue={onChangeParcelasTotal} />
            {current !== null && (
              <Text fontSize={12} color="$textTertiary">
                {installmentHint(current, parcelasTotal)}
              </Text>
            )}
          </YStack>
        </>
      )}
    </>
  );
}

function installmentHint(current: number, total: number): string {
  if (current === 0) return 'A 1ª parcela ainda não entrou em nenhuma fatura.';
  if (current > total)
    return 'Todas as parcelas já passaram — entram em faturas antigas, como pagas.';
  if (current === 1) return `Hoje na parcela 1 de ${total}.`;
  return `Hoje na parcela ${current} de ${total}. As anteriores entram nas faturas passadas, como pagas.`;
}
