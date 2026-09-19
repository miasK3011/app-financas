import { Button, XStack } from 'tamagui';

export type SegmentedControlOption<T extends string> = {
  value: T;
  label: string;
};

export type SegmentedControlProps<T extends string> = {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/**
 * Pílula única com o segmento ativo preenchido (`.segmented`/`.segment`
 * em vários mockups: NovaCompra, AssinaturaEditar, Estatísticas,
 * ImportarCSV) — issue #5, achado #5. Antes cada opção era um `Button`
 * independente lado a lado, cada um com sua própria borda.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <XStack
      backgroundColor="$bg"
      borderColor="$border"
      borderWidth={1}
      borderRadius={999}
      padding={4}
      gap="$1"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Button
            key={option.value}
            flex={1}
            size="$3"
            onPress={() => onChange(option.value)}
            backgroundColor={active ? '$primary' : 'transparent'}
            color={active ? 'white' : '$textSecondary'}
            borderWidth={0}
            fontWeight="700"
            fontSize={13}
            borderRadius={999}
          >
            {option.label}
          </Button>
        );
      })}
    </XStack>
  );
}
