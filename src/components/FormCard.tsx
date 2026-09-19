import type { ReactNode } from 'react';
import { Text, YStack } from 'tamagui';

export type FormCardProps = {
  title: string;
  children: ReactNode;
};

/**
 * Agrupamento de campos em card branco com título uppercase
 * (`.card`/`.card-title` em todo mockup de formulário: NovaCompra,
 * AssinaturaEditar, EstabelecimentoDetalhe...) — issue #5, achado #2.
 * Antes os campos ficavam soltos, em sequência direta no fundo da tela.
 */
export function FormCard({ title, children }: FormCardProps) {
  return (
    <YStack
      backgroundColor="$surface"
      borderColor="$border"
      borderWidth={1}
      borderRadius="$lg"
      padding={18}
      gap="$3"
    >
      <Text
        fontSize={12}
        fontWeight="700"
        color="$textTertiary"
        textTransform="uppercase"
        letterSpacing={0.7}
      >
        {title}
      </Text>
      {children}
    </YStack>
  );
}
