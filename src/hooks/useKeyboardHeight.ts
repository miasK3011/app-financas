import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

/**
 * Altura real do teclado (medida pelo próprio Android via evento, não
 * estimada) — usada como padding extra no fim de um ScrollView para
 * garantir espaço de rolagem suficiente para tirar o campo focado de
 * baixo do teclado. Preferido a `KeyboardAvoidingView`, cujo cálculo
 * de deslocamento fica impreciso sob o modo edge-to-edge do Android.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      setHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return height;
}
