import { Text, type TextProps } from 'tamagui';

import { formatBRL } from '@/domain/shared/money';

/**
 * Valor monetário em Lora (design-brief.md §3.1 — a fonte serifada é
 * reservada só para títulos e valores monetários).
 */
export function Money({ cents, ...rest }: { cents: number } & TextProps) {
  return (
    <Text fontFamily="$heading" {...rest}>
      {formatBRL(cents)}
    </Text>
  );
}
