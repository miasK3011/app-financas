import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Button, Input, Text, YStack } from 'tamagui';
import { z } from 'zod';

import { Screen } from '@/components/Screen';
import { reaisToCents } from '@/domain/shared/money';
import { useMonthBalance } from '@/hooks/useMonthBalance';

const formSchema = z.object({
  descricao: z.string().min(1),
  valorReais: z.number().positive(),
});

export default function NovaEntradaAvulsaScreen() {
  const router = useRouter();
  const today = new Date();
  const { addEntry } = useMonthBalance(today.getFullYear(), today.getMonth() + 1);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { descricao: '', valorReais: undefined },
  });

  const onSubmit = handleSubmit(async (data) => {
    await addEntry({
      descricao: data.descricao,
      valor: reaisToCents(data.valorReais),
      data: new Date(),
    });
    router.back();
  });

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <YStack flex={1} backgroundColor="$bg" padding={20} gap="$4">
        <Text fontFamily="$heading" fontSize={20} fontWeight="600" color="$text">
          Nova entrada avulsa
        </Text>

        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Descrição
          </Text>
          <Controller
            control={control}
            name="descricao"
            render={({ field }) => (
              <Input
                value={field.value}
                onChangeText={field.onChange}
                placeholder="Ex.: Freela de design"
                borderColor="$border"
                borderRadius="$md"
              />
            )}
          />
          {errors.descricao && (
            <Text fontSize={12} color="$error">
              Informe uma descrição
            </Text>
          )}
        </YStack>

        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Valor (R$)
          </Text>
          <Controller
            control={control}
            name="valorReais"
            render={({ field }) => (
              <Input
                value={field.value === undefined ? '' : String(field.value)}
                onChangeText={(text) =>
                  field.onChange(text === '' ? undefined : Number(text.replace(',', '.')))
                }
                placeholder="Ex.: 200"
                keyboardType="decimal-pad"
                borderColor="$border"
                borderRadius="$md"
              />
            )}
          />
          {errors.valorReais && (
            <Text fontSize={12} color="$error">
              Informe um valor maior que zero
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
          Adicionar entrada
        </Button>
      </YStack>
    </Screen>
  );
}
