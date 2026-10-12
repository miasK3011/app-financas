import { Text } from 'tamagui';

/**
 * Cabeçalho de um grupo de dia ("Hoje", "Ontem", "17 de setembro") —
 * compartilhado entre a tela Compras e o detalhe da fatura (FR-007 e
 * FR-013 da feature 003) para manter o mesmo estilo nas duas listas.
 */
export function DayGroupHeader({ label }: { label: string }) {
  return (
    <Text
      fontSize={11.5}
      fontWeight="700"
      letterSpacing={0.5}
      textTransform="uppercase"
      color="$textTertiary"
    >
      {label}
    </Text>
  );
}
