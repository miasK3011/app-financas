import type { ReactNode } from 'react';
import { KeyboardAvoidingView } from 'react-native';
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
 * `KeyboardAvoidingView` evita que o teclado tampe o campo focado nos
 * formulários mais longos (rola a tela para cima em vez de cobrir o
 * input) — `behavior="height"` é o que funciona no Android.
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
