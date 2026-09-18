import { Input, type InputProps } from 'tamagui';

export type AppInputProps = InputProps & {
  /** Realça a borda em `$error` quando o campo está inválido. */
  error?: boolean;
};

/**
 * O `Input` padrão do Tamagui não define `backgroundColor`, então cai
 * no cinza de tema (`#f8f8f8`) — quase idêntico ao fundo da tela
 * (`$bg` = `#FAFAF9`), o que faz o campo "sumir" visualmente. Este
 * wrapper fixa o fundo em `$surface` (branco) e centraliza o destaque
 * de erro usado em todo formulário do app.
 *
 * `color`/`placeholderTextColor` também são fixados explicitamente —
 * relatado em dispositivo real como texto invisível (branco sobre
 * branco) em alguns campos.
 */
export function AppInput({ error, borderColor, borderWidth, color, ...props }: AppInputProps) {
  return (
    <Input
      backgroundColor="$surface"
      borderRadius="$md"
      borderColor={error ? '$error' : (borderColor ?? '$border')}
      borderWidth={error ? 2 : (borderWidth ?? 1)}
      color={color ?? '$text'}
      placeholderTextColor="$textTertiary"
      {...props}
    />
  );
}
