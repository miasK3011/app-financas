import { Button, type ButtonProps } from 'tamagui';

/**
 * Nenhum `Button` do app define `pressStyle`, então pressionar um
 * botão `$primary` cai no default do Tamagui (`$backgroundPress`),
 * que no tema claro resolve pra um cinza quase-branco — indistinguível
 * do fundo do app. Este wrapper fixa o fundo padrão e o escurecimento
 * ao pressionar num único ponto, em vez de repetir `pressStyle` em
 * cada uma das ~20 telas que usam um botão de ação principal.
 */
export function PrimaryButton(props: ButtonProps) {
  return (
    <Button
      backgroundColor="$primary"
      pressStyle={{ backgroundColor: '$primaryDark' }}
      {...props}
    />
  );
}
