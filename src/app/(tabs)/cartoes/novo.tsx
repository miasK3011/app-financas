import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Button, Input, Text, YStack } from 'tamagui';

import { Screen } from '@/components/Screen';
import { useCards } from '@/hooks/useCards';
import { type CardInput, cardInputSchema } from '@/repositories/cardsRepository';

export default function NovoCartaoScreen() {
  const router = useRouter();
  const { create } = useCards();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CardInput>({
    resolver: zodResolver(cardInputSchema),
    defaultValues: { nome: '', diaFechamento: undefined, diaVencimento: undefined },
  });

  const onSubmit = handleSubmit(async (data) => {
    await create(data);
    router.back();
  });

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <YStack flex={1} backgroundColor="$bg" padding={20} gap="$4">
        <Text fontFamily="$heading" fontSize={20} fontWeight="600" color="$text">
          Novo cartão
        </Text>

        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Nome
          </Text>
          <Controller
            control={control}
            name="nome"
            render={({ field }) => (
              <Input
                value={field.value}
                onChangeText={field.onChange}
                placeholder="Ex.: Nubank"
                borderColor="$border"
                borderRadius="$md"
              />
            )}
          />
          {errors.nome && (
            <Text fontSize={12} color="$error">
              Informe um nome para o cartão
            </Text>
          )}
        </YStack>

        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Dia de fechamento
          </Text>
          <Controller
            control={control}
            name="diaFechamento"
            render={({ field }) => (
              <Input
                value={field.value === undefined ? '' : String(field.value)}
                onChangeText={(text) => field.onChange(text === '' ? undefined : Number(text))}
                placeholder="Ex.: 10"
                keyboardType="number-pad"
                borderColor="$border"
                borderRadius="$md"
              />
            )}
          />
          {errors.diaFechamento && (
            <Text fontSize={12} color="$error">
              Informe um dia entre 1 e 31
            </Text>
          )}
        </YStack>

        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Dia de vencimento
          </Text>
          <Controller
            control={control}
            name="diaVencimento"
            render={({ field }) => (
              <Input
                value={field.value === undefined ? '' : String(field.value)}
                onChangeText={(text) => field.onChange(text === '' ? undefined : Number(text))}
                placeholder="Ex.: 17"
                keyboardType="number-pad"
                borderColor="$border"
                borderRadius="$md"
              />
            )}
          />
          {errors.diaVencimento && (
            <Text fontSize={12} color="$error">
              Informe um dia entre 1 e 31
            </Text>
          )}
        </YStack>

        <Button
          onPress={onSubmit}
          disabled={isSubmitting}
          backgroundColor="$primary"
          color="white"
          fontWeight="700"
          borderRadius={999}
        >
          Salvar cartão
        </Button>
      </YStack>
    </Screen>
  );
}
