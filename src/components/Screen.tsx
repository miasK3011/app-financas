import type { ReactNode } from 'react';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

/**
 * Todo Android moderno (Expo SDK 57 / React Native 0.86) desenha o app
 * "edge-to-edge" por padrão — o conteúdo vai até atrás da barra de
 * status, sem respiro algum, a menos que a própria tela adicione o
 * padding de safe-area. `SafeAreaView` cobre esse espaço com o fundo
 * do app (em vez de deixá-lo transparente/preto), então a barra de
 * status para de "brigar" visualmente com o conteúdo.
 *
 * Sem `KeyboardAvoidingView` aqui: sob edge-to-edge, o cálculo de
 * altura do teclado do RN fica impreciso e desloca de menos. Telas com
 * formulário evitam o teclado tampando o campo via `useKeyboardHeight`
 * — padding extra real (medido, não estimado) no fim do ScrollView.
 */
export function Screen({
  children,
  edges = ['top', 'left', 'right'],
}: {
  children: ReactNode;
  edges?: Edge[];
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={edges}>
      {children}
    </SafeAreaView>
  );
}
