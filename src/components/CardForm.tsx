import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Text, YStack } from 'tamagui';

import { AppInput } from '@/components/AppInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SegmentedControl } from '@/components/SegmentedControl';
import { type CardInput, cardInputSchema } from '@/repositories/cardsRepository';

type Props = {
  /** Ausente em "Novo cartão"; preenchido em "Editar cartão". */
  initialValues?: CardInput;
  submitLabel: string;
  onSubmit: (data: CardInput) => Promise<void>;
};

/** Campos compartilhados de "Novo cartão" e "Editar cartão". */
export function CardForm({ initialValues, submitLabel, onSubmit }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CardInput>({
    resolver: zodResolver(cardInputSchema),
    defaultValues: initialValues ?? {
      nome: '',
      diaFechamento: undefined,
      diaVencimento: undefined,
      compraNoFechamentoVaiParaProxima: true,
    },
  });

  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Text fontSize={13} color="$textSecondary">
          Nome
        </Text>
        <Controller
          control={control}
          name="nome"
          render={({ field, fieldState }) => (
            <AppInput
              value={field.value}
              onChangeText={field.onChange}
              placeholder="Ex.: Nubank"
              error={Boolean(fieldState.error)}
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
          render={({ field, fieldState }) => (
            <AppInput
              value={field.value === undefined ? '' : String(field.value)}
              onChangeText={(text) =>
                field.onChange(text === '' ? undefined : Number(text.replace(/\D/g, '')))
              }
              placeholder="Ex.: 10"
              keyboardType="number-pad"
              error={Boolean(fieldState.error)}
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
          Compras feitas no dia do fechamento vão para
        </Text>
        <Controller
          control={control}
          name="compraNoFechamentoVaiParaProxima"
          render={({ field }) => (
            <SegmentedControl
              options={[
                { value: 'PROXIMA', label: 'Próxima fatura' },
                { value: 'ATUAL', label: 'Fatura atual' },
              ]}
              value={field.value ? 'PROXIMA' : 'ATUAL'}
              onChange={(next) => field.onChange(next === 'PROXIMA')}
            />
          )}
        />
        <Text fontSize={12} color="$textTertiary">
          Ex.: o Nubank fecha à meia-noite (próxima fatura); o Mercado Pago, só no fim do dia
          (fatura atual).
        </Text>
      </YStack>

      <YStack gap="$2">
        <Text fontSize={13} color="$textSecondary">
          Dia de vencimento
        </Text>
        <Controller
          control={control}
          name="diaVencimento"
          render={({ field, fieldState }) => (
            <AppInput
              value={field.value === undefined ? '' : String(field.value)}
              onChangeText={(text) =>
                field.onChange(text === '' ? undefined : Number(text.replace(/\D/g, '')))
              }
              placeholder="Ex.: 17"
              keyboardType="number-pad"
              error={Boolean(fieldState.error)}
            />
          )}
        />
        {errors.diaVencimento && (
          <Text fontSize={12} color="$error">
            Informe um dia entre 1 e 31
          </Text>
        )}
      </YStack>

      <PrimaryButton
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        color="white"
        fontWeight="700"
        borderRadius={999}
      >
        {submitLabel}
      </PrimaryButton>
    </YStack>
  );
}
