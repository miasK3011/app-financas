import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { Button, Text, XStack } from 'tamagui';

export type MonthNavigatorProps = {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled: boolean;
  nextDisabled: boolean;
};

const SWIPE_THRESHOLD = 40;

/**
 * FR-006/FR-007: seta de voltar, mês/ano centralizado, seta de
 * avançar; arrastar o dedo sobre a área do navegador tem o mesmo
 * efeito de tocar na seta correspondente (swipe pra direita = mês
 * anterior, pra esquerda = próximo mês — convenção usual de
 * calendário). Setas desabilitadas recebem `prevDisabled`/
 * `nextDisabled` de fora (`MonthRange`, FR-008/FR-009).
 */
export function MonthNavigator({
  label,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
}: MonthNavigatorProps) {
  const swipe = Gesture.Pan().onEnd((event) => {
    if (event.translationX > SWIPE_THRESHOLD && !prevDisabled) {
      runOnJS(onPrev)();
    } else if (event.translationX < -SWIPE_THRESHOLD && !nextDisabled) {
      runOnJS(onNext)();
    }
  });

  return (
    <GestureDetector gesture={swipe}>
      <XStack alignItems="center" gap="$2">
        <Button
          circular
          size="$3"
          backgroundColor="$surface"
          borderColor="$border"
          borderWidth={1}
          disabled={prevDisabled}
          opacity={prevDisabled ? 0.35 : 1}
          onPress={onPrev}
          icon={<ChevronLeft size={18} />}
        />
        <Text
          flex={1}
          textAlign="center"
          fontFamily="$heading"
          fontSize={18}
          fontWeight="600"
          color="$text"
        >
          {label}
        </Text>
        <Button
          circular
          size="$3"
          backgroundColor="$surface"
          borderColor="$border"
          borderWidth={1}
          disabled={nextDisabled}
          opacity={nextDisabled ? 0.35 : 1}
          onPress={onNext}
          icon={<ChevronRight size={18} />}
        />
      </XStack>
    </GestureDetector>
  );
}
