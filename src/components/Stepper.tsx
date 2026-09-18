import { Minus, Plus } from 'lucide-react-native';
import { Button, Text, XStack } from 'tamagui';

export type StepperProps = {
  value: number;
  onChangeValue: (value: number) => void;
  min?: number;
  max?: number;
};

/**
 * Seletor de "+"/"-" para inteiros pequenos (nº de parcelas etc.) —
 * evita de vez os problemas de campo de texto numérico no Android
 * (teclado não deixa apagar o último dígito, valor negativo, campo
 * "vazio" inválido): aqui não existe estado intermediário inválido.
 */
export function Stepper({ value, onChangeValue, min = 1, max }: StepperProps) {
  const canDecrement = value > min;
  const canIncrement = max === undefined || value < max;

  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      height={44}
      paddingHorizontal={8}
      backgroundColor="$surface"
      borderColor="$border"
      borderWidth={1}
      borderRadius="$md"
    >
      <Button
        size="$2"
        circular
        chromeless
        disabled={!canDecrement}
        opacity={canDecrement ? 1 : 0.35}
        onPress={() => onChangeValue(value - 1)}
        icon={<Minus size={16} />}
      />
      <Text fontSize={15} fontWeight="600" color="$text">
        {value}
      </Text>
      <Button
        size="$2"
        circular
        chromeless
        disabled={!canIncrement}
        opacity={canIncrement ? 1 : 0.35}
        onPress={() => onChangeValue(value + 1)}
        icon={<Plus size={16} />}
      />
    </XStack>
  );
}
