import { AppInput, type AppInputProps } from '@/components/AppInput';
import { formatBRL } from '@/domain/shared/money';

export type MoneyInputProps = Omit<AppInputProps, 'value' | 'onChangeText'> & {
  /** Valor em centavos; `undefined` mostra o campo vazio (R$ 0,00). */
  value: number | undefined;
  onChangeValue: (cents: number | undefined) => void;
};

/**
 * Máscara "estilo app de banco": o texto digitado é lido só pelos
 * dígitos (ignora tudo que não é número), que são interpretados
 * diretamente como centavos — por isso o preenchimento sempre acontece
 * da direita para a esquerda, com as duas casas decimais fixas.
 */
export function MoneyInput({ value, onChangeValue, ...inputProps }: MoneyInputProps) {
  const handleChangeText = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '');
    onChangeValue(digitsOnly === '' ? undefined : Number(digitsOnly));
  };

  return (
    <AppInput
      value={value === undefined ? '' : formatBRL(value)}
      onChangeText={handleChangeText}
      keyboardType="number-pad"
      placeholder="R$ 0,00"
      {...inputProps}
    />
  );
}
