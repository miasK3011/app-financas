import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Text, YStack } from 'tamagui';
import { z } from 'zod';

import { AppInput } from '@/components/AppInput';
import { MoneyInput } from '@/components/MoneyInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { useMonthBalance } from '@/hooks/useMonthBalance';

const formSchema = z.object({
  descricao: z.string().min(1),
  valorCentavos: z.number().int().positive(),
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
    defaultValues: { descricao: '', valorCentavos: undefined },
  });

  const onSubmit = handleSubmit(async (data) => {
    await addEntry({
      descricao: data.descricao,
      valor: data.valorCentavos,
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
            render={({ field, fieldState }) => (
              <AppInput
                value={field.value}
                onChangeText={field.onChange}
                placeholder="Ex.: Freela de design"
                error={Boolean(fieldState.error)}
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
            name="valorCentavos"
            render={({ field, fieldState }) => (
              <MoneyInput
                value={field.value}
                onChangeValue={field.onChange}
                error={Boolean(fieldState.error)}
              />
            )}
          />
          {errors.valorCentavos && (
            <Text fontSize={12} color="$error">
              Informe um valor maior que zero
            </Text>
          )}
        </YStack>

        <PrimaryButton
          onPress={onSubmit}
          disabled={isSubmitting}
          color="white"
          fontWeight="700"
          borderRadius={999}
        >
          Adicionar entrada
        </PrimaryButton>
      </YStack>
    </Screen>
  );
}
