import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Text, XStack, type XStackProps } from 'tamagui';

export type DateFieldProps = Omit<XStackProps, 'children'> & {
  value: Date;
  onChangeValue: (date: Date) => void;
};

function formatDateBR(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

/** Abre o date picker nativo do Android (única plataforma suportada pelo app). */
export function DateField({ value, onChangeValue, ...stackProps }: DateFieldProps) {
  const openPicker = () => {
    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      onChange: (_event, selectedDate) => {
        if (selectedDate) onChangeValue(selectedDate);
      },
    });
  };

  return (
    <XStack
      height={44}
      paddingHorizontal={16}
      alignItems="center"
      backgroundColor="$surface"
      borderColor="$border"
      borderWidth={1}
      borderRadius="$md"
      onPress={openPicker}
      {...stackProps}
    >
      <Text fontSize={14} color="$text">
        {formatDateBR(value)}
      </Text>
    </XStack>
  );
}
