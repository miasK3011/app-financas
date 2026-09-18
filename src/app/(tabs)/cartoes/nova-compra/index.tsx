import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';
import { z } from 'zod';

import { AppInput } from '@/components/AppInput';
import { DateField } from '@/components/DateField';
import { MoneyInput } from '@/components/MoneyInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { Stepper } from '@/components/Stepper';
import { requiresMotivoResponsavelFields } from '@/domain/expenseSplitting/requiresMotivoResponsavelFields';
import { useBestCard } from '@/hooks/useBestCard';
import { useCards } from '@/hooks/useCards';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { createCardPurchase, createPixPurchase } from '@/repositories/purchasesRepository';

const formSchema = z
  .object({
    descricao: z.string().min(1),
    valorCentavos: z.number().int().positive(),
    dataCompra: z.date(),
    formaPagamento: z.enum(['PIX', 'CARTAO']),
    cartaoId: z.string().optional(),
    parcelasTotal: z.number().int().min(1),
    parcelaAtual: z.number().int().min(1),
    tagsText: z.string().optional(),
    comentario: z.string().optional(),
    valorResponsabilidade: z.number().int().optional(),
    motivo: z.string().optional(),
    responsavel: z.string().optional(),
  })
  .refine((data) => data.formaPagamento !== 'CARTAO' || Boolean(data.cartaoId), {
    message: 'Selecione um cartão',
    path: ['cartaoId'],
  })
  .refine((data) => data.parcelaAtual <= data.parcelasTotal, {
    message: 'A parcela atual não pode ser maior que o total de parcelas',
    path: ['parcelaAtual'],
  })
  .refine(
    (data) =>
      data.valorResponsabilidade === undefined ||
      (data.valorResponsabilidade >= 0 && data.valorResponsabilidade <= data.valorCentavos),
    {
      message: 'O valor de responsabilidade deve estar entre 0 e o valor total da compra',
      path: ['valorResponsabilidade'],
    },
  );

type FormValues = z.infer<typeof formSchema>;

export default function NovaCompraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    cartaoId?: string;
    cartaoNome?: string;
    formaPagamento?: 'PIX' | 'CARTAO';
    categoriaId?: string;
    categoriaNome?: string;
    estabelecimentoId?: string;
    estabelecimentoNome?: string;
  }>();
  const { cards } = useCards();
  const { suggestion: bestCard } = useBestCard();
  const keyboardHeight = useKeyboardHeight();
  const [categoriaId, setCategoriaId] = useState<string | undefined>(params.categoriaId);
  const [categoriaNome, setCategoriaNome] = useState<string | undefined>(params.categoriaNome);
  const [estabelecimentoId, setEstabelecimentoId] = useState<string | undefined>(
    params.estabelecimentoId,
  );
  const [estabelecimentoNome, setEstabelecimentoNome] = useState<string | undefined>(
    params.estabelecimentoNome,
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: '',
      valorCentavos: undefined,
      dataCompra: new Date(),
      formaPagamento: params.formaPagamento ?? (params.cartaoId ? 'CARTAO' : 'PIX'),
      cartaoId: params.cartaoId,
      parcelasTotal: 1,
      parcelaAtual: 1,
      tagsText: '',
      comentario: '',
      valorResponsabilidade: undefined,
      motivo: '',
      responsavel: '',
    },
  });

  // Voltando do drawer de categoria (T058) — a tela já está montada
  // (router.dismissTo não a recria), então só sincronizamos os params.
  useEffect(() => {
    if (params.categoriaId) {
      setCategoriaId(params.categoriaId);
      setCategoriaNome(params.categoriaNome);
    }
  }, [params.categoriaId, params.categoriaNome]);

  useEffect(() => {
    if (params.estabelecimentoId) {
      setEstabelecimentoId(params.estabelecimentoId);
      setEstabelecimentoNome(params.estabelecimentoNome);
    }
  }, [params.estabelecimentoId, params.estabelecimentoNome]);

  const formaPagamento = watch('formaPagamento');
  const parcelasTotal = watch('parcelasTotal');
  const selectedCartaoId = watch('cartaoId');
  const valorCentavos = watch('valorCentavos');
  const valorResponsabilidade = watch('valorResponsabilidade');
  const descricaoAtual = watch('descricao');

  const onSubmit = handleSubmit(async (data) => {
    const tagNomes = (data.tagsText ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (data.formaPagamento === 'CARTAO') {
      await createCardPurchase({
        descricao: data.descricao,
        valorTotalOriginal: data.valorCentavos,
        dataCompra: data.dataCompra,
        cartaoId: data.cartaoId!,
        parcelasTotal: data.parcelasTotal,
        parcelaAtual: data.parcelaAtual,
        categoriaId,
        comentario: data.comentario || undefined,
        tagNomes,
        valorResponsabilidade: data.valorResponsabilidade,
        motivo: data.motivo || undefined,
        responsavel: data.responsavel || undefined,
        estabelecimentoId,
      });
    } else {
      await createPixPurchase({
        descricao: data.descricao,
        valorTotalOriginal: data.valorCentavos,
        dataCompra: data.dataCompra,
        categoriaId,
        comentario: data.comentario || undefined,
        tagNomes,
        valorResponsabilidade: data.valorResponsabilidade,
        motivo: data.motivo || undefined,
        responsavel: data.responsavel || undefined,
        estabelecimentoId,
      });
    }

    router.back();
  });

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <XStack alignItems="center" gap="$3" padding={20} paddingBottom={0}>
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
          Nova compra
        </Text>
      </XStack>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 20 + keyboardHeight, gap: 18 }}
        keyboardShouldPersistTaps="handled"
      >
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
                placeholder="Ex.: Pizzaria Napoli"
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

        <XStack gap="$3">
          <YStack flex={1} gap="$2">
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
                Valor inválido
              </Text>
            )}
          </YStack>

          <YStack flex={1} gap="$2">
            <Text fontSize={13} color="$textSecondary">
              Data
            </Text>
            <Controller
              control={control}
              name="dataCompra"
              render={({ field }) => (
                <DateField value={field.value} onChangeValue={field.onChange} />
              )}
            />
          </YStack>
        </XStack>

        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Forma de pagamento
          </Text>
          <XStack gap="$2">
            <Button
              flex={1}
              onPress={() => setValue('formaPagamento', 'PIX')}
              backgroundColor={formaPagamento === 'PIX' ? '$primary' : '$surface'}
              color={formaPagamento === 'PIX' ? 'white' : '$text'}
              borderColor="$border"
              borderWidth={1}
              fontWeight="700"
            >
              Pix
            </Button>
            <Button
              flex={1}
              onPress={() => setValue('formaPagamento', 'CARTAO')}
              backgroundColor={formaPagamento === 'CARTAO' ? '$primary' : '$surface'}
              color={formaPagamento === 'CARTAO' ? 'white' : '$text'}
              borderColor="$border"
              borderWidth={1}
              fontWeight="700"
            >
              Cartão
            </Button>
          </XStack>
        </YStack>

        {formaPagamento === 'CARTAO' && (
          <>
            <YStack gap="$2">
              <Text fontSize={13} color="$textSecondary">
                Cartão
              </Text>
              <XStack flexWrap="wrap" gap="$2">
                {cards.map((card) => (
                  <Button
                    key={card.id}
                    onPress={() => setValue('cartaoId', card.id)}
                    size="$3"
                    backgroundColor={selectedCartaoId === card.id ? '$primary' : '$surface'}
                    color={selectedCartaoId === card.id ? 'white' : '$text'}
                    borderColor="$border"
                    borderWidth={1}
                  >
                    {card.nome}
                  </Button>
                ))}
              </XStack>
              {errors.cartaoId && (
                <Text fontSize={12} color="$error">
                  Selecione um cartão
                </Text>
              )}
              {cards.length > 1 && bestCard && bestCard.cardId !== selectedCartaoId && (
                <XStack
                  alignItems="center"
                  justifyContent="space-between"
                  backgroundColor="$infoBg"
                  borderRadius="$md"
                  paddingHorizontal={12}
                  paddingVertical={10}
                  marginTop="$1"
                >
                  <Text fontSize={12} color="$infoDark" flex={1}>
                    Melhor hoje:{' '}
                    {cards.find((card) => card.id === bestCard.cardId)?.nome ?? 'outro cartão'}{' '}
                    (vence em {bestCard.daysUntilDue} dias)
                  </Text>
                  <Button
                    onPress={() => setValue('cartaoId', bestCard.cardId)}
                    size="$2"
                    chromeless
                    color="$infoDark"
                    fontWeight="700"
                  >
                    Usar
                  </Button>
                </XStack>
              )}
            </YStack>

            <XStack gap="$3">
              <YStack flex={1} gap="$2">
                <Text fontSize={13} color="$textSecondary">
                  Nº de parcelas
                </Text>
                <Controller
                  control={control}
                  name="parcelasTotal"
                  render={({ field }) => (
                    <Stepper
                      value={field.value}
                      onChangeValue={(next) => {
                        field.onChange(next);
                        if (getValues('parcelaAtual') > next) {
                          setValue('parcelaAtual', next);
                        }
                      }}
                    />
                  )}
                />
              </YStack>

              {parcelasTotal > 1 && (
                <YStack flex={1} gap="$2">
                  <Text fontSize={13} color="$textSecondary">
                    Parcela atual
                  </Text>
                  <Controller
                    control={control}
                    name="parcelaAtual"
                    render={({ field }) => (
                      <Stepper
                        value={field.value}
                        onChangeValue={field.onChange}
                        max={parcelasTotal}
                      />
                    )}
                  />
                </YStack>
              )}
            </XStack>
          </>
        )}

        <XStack
          justifyContent="space-between"
          alignItems="center"
          paddingVertical={14}
          borderTopWidth={1}
          borderColor="$border"
          onPress={() =>
            router.push({
              pathname: '/cartoes/nova-compra/categoria',
              params: { categoriaId, categoriaNome },
            })
          }
        >
          <Text fontSize={13} color="$textSecondary">
            Categoria
          </Text>
          <XStack alignItems="center" gap="$2">
            <Text fontSize={14.5} fontWeight="600" color="$text">
              {categoriaNome ?? 'Nenhuma'}
            </Text>
            <ChevronRight size={16} color="#6C6C6D" />
          </XStack>
        </XStack>

        <XStack
          justifyContent="space-between"
          alignItems="center"
          paddingVertical={14}
          borderTopWidth={1}
          borderColor="$border"
          onPress={() =>
            router.push({
              pathname: '/cartoes/nova-compra/estabelecimento',
              params: { descricao: descricaoAtual },
            })
          }
        >
          <Text fontSize={13} color="$textSecondary">
            Estabelecimento
          </Text>
          <XStack alignItems="center" gap="$2">
            <Text fontSize={14.5} fontWeight="600" color="$text">
              {estabelecimentoNome ?? 'Nenhum'}
            </Text>
            <ChevronRight size={16} color="#6C6C6D" />
          </XStack>
        </XStack>

        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Tags (separadas por vírgula)
          </Text>
          <Controller
            control={control}
            name="tagsText"
            render={({ field }) => (
              <AppInput
                value={field.value}
                onChangeText={field.onChange}
                placeholder="Ex.: Trabalho, Presente"
              />
            )}
          />
        </YStack>

        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Comentário
          </Text>
          <Controller
            control={control}
            name="comentario"
            render={({ field }) => (
              <AppInput value={field.value} onChangeText={field.onChange} placeholder="Opcional" />
            )}
          />
        </YStack>

        <YStack
          backgroundColor="$surface"
          borderColor="$border"
          borderWidth={1}
          borderRadius="$lg"
          padding={18}
          gap="$3"
        >
          <Text fontSize={12} fontWeight="700" color="$textTertiary" textTransform="uppercase">
            Divisão de responsabilidade (opcional)
          </Text>
          <Controller
            control={control}
            name="valorResponsabilidade"
            render={({ field, fieldState }) => (
              <MoneyInput
                value={field.value}
                onChangeValue={field.onChange}
                error={Boolean(fieldState.error)}
                placeholder="Deixe em branco para usar o valor total"
              />
            )}
          />
          {errors.valorResponsabilidade && (
            <Text fontSize={12} color="$error">
              {errors.valorResponsabilidade.message}
            </Text>
          )}

          {requiresMotivoResponsavelFields(valorResponsabilidade ?? null, valorCentavos ?? 0) && (
            <XStack gap="$3">
              <YStack flex={1} gap="$2">
                <Text fontSize={13} color="$textSecondary">
                  Motivo (opcional)
                </Text>
                <Controller
                  control={control}
                  name="motivo"
                  render={({ field }) => (
                    <AppInput
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder="Ex.: Dividimos a conta"
                    />
                  )}
                />
              </YStack>
              <YStack flex={1} gap="$2">
                <Text fontSize={13} color="$textSecondary">
                  Responsável (opcional)
                </Text>
                <Controller
                  control={control}
                  name="responsavel"
                  render={({ field }) => (
                    <AppInput
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder="Ex.: Maria"
                    />
                  )}
                />
              </YStack>
            </XStack>
          )}
        </YStack>

        <PrimaryButton
          onPress={onSubmit}
          disabled={isSubmitting}
          color="white"
          fontWeight="700"
          borderRadius={999}
        >
          Salvar compra
        </PrimaryButton>
      </ScrollView>
    </Screen>
  );
}
