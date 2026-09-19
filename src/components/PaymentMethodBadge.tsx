import { CreditCard, Zap } from 'lucide-react-native';
import { XStack } from 'tamagui';

import { colors } from '@/theme/colors';

import { TransactionAvatar, type TransactionAvatarProps } from './TransactionAvatar';

export type FormaPagamento = 'CARTAO' | 'PIX';

/** Selo pequeno sobreposto ao avatar indicando a forma de pagamento (FR-011). */
export function PaymentMethodBadge({
  formaPagamento,
  size = 18,
}: {
  formaPagamento: FormaPagamento;
  size?: number;
}) {
  const Icon = formaPagamento === 'CARTAO' ? CreditCard : Zap;
  const bg = formaPagamento === 'CARTAO' ? colors.primaryLight : colors.infoBg;
  const fg = formaPagamento === 'CARTAO' ? colors.primaryDark : colors.infoDark;

  return (
    <XStack
      position="absolute"
      right={-3}
      bottom={-3}
      width={size}
      height={size}
      borderRadius={size / 2}
      backgroundColor={bg}
      borderWidth={1.5}
      borderColor="$surface"
      alignItems="center"
      justifyContent="center"
    >
      <Icon size={size * 0.6} color={fg} strokeWidth={2.4} />
    </XStack>
  );
}

export type PurchaseAvatarProps = TransactionAvatarProps & { formaPagamento: FormaPagamento };

/** `TransactionAvatar` (já existente) + `PaymentMethodBadge` sobreposto — usado nas listas da tela Compras. */
export function PurchaseAvatar({ formaPagamento, ...avatarProps }: PurchaseAvatarProps) {
  return (
    <XStack position="relative">
      <TransactionAvatar {...avatarProps} />
      <PaymentMethodBadge formaPagamento={formaPagamento} />
    </XStack>
  );
}
