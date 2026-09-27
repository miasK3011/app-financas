import { useRouter } from 'expo-router';
import { Text, YStack } from 'tamagui';

import { CardForm } from '@/components/CardForm';
import { Screen } from '@/components/Screen';
import { useCards } from '@/hooks/useCards';

export default function NovoCartaoScreen() {
  const router = useRouter();
  const { create } = useCards();

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <YStack flex={1} backgroundColor="$bg" padding={20} gap="$4">
        <Text fontFamily="$heading" fontSize={20} fontWeight="600" color="$text">
          Novo cartão
        </Text>

        <CardForm
          submitLabel="Salvar cartão"
          onSubmit={async (data) => {
            await create(data);
            router.back();
          }}
        />
      </YStack>
    </Screen>
  );
}
