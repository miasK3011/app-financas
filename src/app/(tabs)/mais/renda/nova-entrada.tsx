import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { Button, Text, XStack, YStack } from 'tamagui';
import { z } from 'zod';

import { AppInput } from '@/components/AppInput';
import { MoneyInput } from '@/components/MoneyInput';
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
      <XStack alignItems="center" justifyContent="space-between" padding={20} paddingBottom={0}>
        <XStack alignItems="center" gap="$3">
          <Button
            onPress={() => router.back()}
            circular
            size="$3"
            backgroundColor="$surface"
            borderColor="$border"
            borderWidth={1}
            icon={<ChevronLeft size={18} />}
          />
          <Text fontFamily="$heading" fontSize={18} fontWeight="600" color="$text">
            Nova entrada avulsa
          </Text>
        </XStack>
        <Button
          onPress={onSubmit}
          disabled={isSubmitting}
          chromeless
          color="$primary"
          fontWeight="700"
          fontSize={15}
        >
          Salvar
        </Button>
      </XStack>

      <YStack flex={1} backgroundColor="$bg" padding={20} gap="$4">
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
      </YStack>
    </Screen>
  );
}
