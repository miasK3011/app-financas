import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as LucideIcons from 'lucide-react-native';
import { ChevronRight, CircleCheck, Shapes, X } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';
import { z } from 'zod';

import { AppInput } from '@/components/AppInput';
import { DateField } from '@/components/DateField';
import { FormCard } from '@/components/FormCard';
import { IconAvatar } from '@/components/IconAvatar';
import { Money } from '@/components/Money';
import { MoneyInput } from '@/components/MoneyInput';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Stepper } from '@/components/Stepper';
import { TagInput } from '@/components/TagInput';
import { requiresMotivoResponsavelFields } from '@/domain/expenseSplitting/requiresMotivoResponsavelFields';
import { useBestCard } from '@/hooks/useBestCard';
import { useCards } from '@/hooks/useCards';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import {
  getEstablishment,
  matchEstablishmentForDescription,
} from '@/repositories/establishmentsRepository';
import { createCardPurchase, createPixPurchase } from '@/repositories/purchasesRepository';

type IconProps = { size?: number; color?: string };
const icons = LucideIcons as unknown as Record<string, ComponentType<IconProps>>;

const formSchema = z
  .object({
    descricao: z.string().min(1),
    valorCentavos: z.number().int().positive(),
    dataCompra: z.date(),
    formaPagamento: z.enum(['PIX', 'CARTAO']),
    cartaoId: z.string().optional(),
    parcelasTotal: z.number().int().min(1),
    parcelaAtual: z.number().int().min(1),
    tags: z.array(z.string()).optional(),
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
    categoriaIcone?: string;
    estabelecimentoId?: string;
    estabelecimentoNome?: string;
  }>();
  const { cards } = useCards();
  const { suggestion: bestCard } = useBestCard();
  const keyboardHeight = useKeyboardHeight();
  const [categoriaId, setCategoriaId] = useState<string | undefined>(params.categoriaId);
  const [categoriaNome, setCategoriaNome] = useState<string | undefined>(params.categoriaNome);
  const [categoriaIcone, setCategoriaIcone] = useState<string | undefined>(params.categoriaIcone);
  const [estabelecimentoId, setEstabelecimentoId] = useState<string | undefined>(
    params.estabelecimentoId,
  );
  const [estabelecimentoNome, setEstabelecimentoNome] = useState<string | undefined>(
    params.estabelecimentoNome,
  );
  // NovaCompra.dc.html § "Organização": banner "Reconhecemos X — associar
  // a Y?" quando a descrição bate com um Estabelecimento já conhecido e o
  // usuário ainda não escolheu um manualmente (FR-033).
  const [estabelecimentoSugerido, setEstabelecimentoSugerido] = useState<{
    id: string;
    nome: string;
  } | null>(null);
  // NovaCompra.dc.html: por padrão a responsabilidade é 100% do valor,
  // só-leitura; "Dividir compra" revela o campo editável (issue #10).
  const [splitting, setSplitting] = useState(false);

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
      tags: [],
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
      setCategoriaIcone(params.categoriaIcone);
    }
  }, [params.categoriaId, params.categoriaNome, params.categoriaIcone]);

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

  useEffect(() => {
    if (estabelecimentoId || !descricaoAtual || descricaoAtual.trim().length < 3) {
      setEstabelecimentoSugerido(null);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(async () => {
      const matchedId = await matchEstablishmentForDescription(descricaoAtual);
      if (cancelled) return;
      if (!matchedId) {
        setEstabelecimentoSugerido(null);
        return;
      }
      const establishment = await getEstablishment(matchedId);
      if (!cancelled && establishment) {
        setEstabelecimentoSugerido({ id: establishment.id, nome: establishment.nomeExibicao });
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [descricaoAtual, estabelecimentoId]);

  const onSubmit = handleSubmit(async (data) => {
    const tagNomes = data.tags ?? [];

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
      <XStack alignItems="center" justifyContent="space-between" padding={20} paddingBottom={0}>
        <XStack alignItems="center" gap="$3">
          <Button
            onPress={() => router.back()}
            circular
            size="$3"
            backgroundColor="$surface"
            borderColor="$border"
            borderWidth={1}
            icon={<X size={18} />}
          />
          <Text fontFamily="$heading" fontSize={18} fontWeight="600" color="$text">
            Nova compra
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

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 20 + keyboardHeight, gap: 18 }}
        keyboardShouldPersistTaps="handled"
      >
        <FormCard title="Detalhes">
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
                Valor
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
        </FormCard>

        <FormCard title="Pagamento">
          <YStack gap="$2">
            <Text fontSize={13} color="$textSecondary">
              Forma de pagamento
            </Text>
            <SegmentedControl
              options={[
                { value: 'PIX', label: 'Pix' },
                { value: 'CARTAO', label: 'Cartão' },
              ]}
              value={formaPagamento}
              onChange={(next) => setValue('formaPagamento', next)}
            />
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
                      (fecha em {bestCard.daysUntilClosing} dias)
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
                    Parcelas
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
        </FormCard>

        <FormCard title="Divisão de responsabilidade">
          {!splitting ? (
            <XStack justifyContent="space-between" alignItems="center">
              <YStack gap="$1">
                <Text fontSize={12.5} color="$textSecondary">
                  Sua responsabilidade
                </Text>
                <XStack alignItems="baseline" gap="$2">
                  <Money
                    cents={valorCentavos ?? 0}
                    fontFamily="$heading"
                    fontSize={17}
                    fontWeight="600"
                    color="$text"
                  />
                  <Text fontSize={12} color="$textTertiary">
                    (100% do valor)
                  </Text>
                </XStack>
              </YStack>
              <Button
                onPress={() => setSplitting(true)}
                size="$2"
                borderRadius={999}
                backgroundColor="$surface"
                borderColor="$border"
                borderWidth={1}
                color="$primary"
                fontWeight="700"
              >
                Dividir compra
              </Button>
            </XStack>
          ) : (
            <>
              <Controller
                control={control}
                name="valorResponsabilidade"
                render={({ field, fieldState }) => (
                  <MoneyInput
                    value={field.value}
                    onChangeValue={field.onChange}
                    error={Boolean(fieldState.error)}
                    placeholder="Valor que você vai pagar"
                  />
                )}
              />
              {errors.valorResponsabilidade && (
                <Text fontSize={12} color="$error">
                  {errors.valorResponsabilidade.message}
                </Text>
              )}

              {requiresMotivoResponsavelFields(
                valorResponsabilidade ?? null,
                valorCentavos ?? 0,
              ) && (
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

              <Button
                onPress={() => {
                  setValue('valorResponsabilidade', undefined);
                  setValue('motivo', '');
                  setValue('responsavel', '');
                  setSplitting(false);
                }}
                size="$2"
                chromeless
                alignSelf="flex-start"
                color="$error"
                fontWeight="600"
              >
                Cancelar divisão
              </Button>
            </>
          )}
        </FormCard>

        <FormCard title="Organização">
          <YStack gap="$2">
            <Text fontSize={13} color="$textSecondary">
              Categoria
            </Text>
            <XStack
              backgroundColor="$bg"
              borderColor="$border"
              borderWidth={1}
              borderRadius="$md"
              paddingVertical={9}
              paddingHorizontal={13}
              alignItems="center"
              justifyContent="space-between"
              gap="$2"
              onPress={() =>
                router.push({
                  pathname: '/nova-compra/categoria',
                  params: { categoriaId, categoriaNome, categoriaIcone },
                })
              }
            >
              <XStack alignItems="center" gap="$2.5">
                {categoriaIcone && (
                  <IconAvatar icon={icons[categoriaIcone] ?? Shapes} iconName={categoriaIcone} size={30} />
                )}
                <Text fontSize={14.5} fontWeight="600" color="$text">
                  {categoriaNome ?? 'Nenhuma'}
                </Text>
              </XStack>
              <ChevronRight size={17} color="#6C6C6D" />
            </XStack>
          </YStack>

          <YStack gap="$2">
            <Text fontSize={13} color="$textSecondary">
              Estabelecimento
            </Text>
            <XStack
              backgroundColor="$bg"
              borderColor="$border"
              borderWidth={1}
              borderRadius="$md"
              paddingVertical={9}
              paddingHorizontal={13}
              alignItems="center"
              justifyContent="space-between"
              gap="$2"
              onPress={() =>
                router.push({
                  pathname: '/nova-compra/estabelecimento',
                  params: { descricao: descricaoAtual },
                })
              }
            >
              <Text fontSize={14.5} fontWeight="600" color="$text">
                {estabelecimentoNome ?? 'Nenhum'}
              </Text>
              <ChevronRight size={17} color="#6C6C6D" />
            </XStack>
          </YStack>

          {estabelecimentoSugerido && (
            <XStack
              backgroundColor="$primaryLight"
              borderRadius="$md"
              padding={10}
              alignItems="center"
              gap="$2.5"
            >
              <CircleCheck size={18} color="#234F3E" />
              <Text flex={1} fontSize={12.5} color="$primaryDark">
                Reconhecemos &quot;{descricaoAtual}&quot; — associar a{' '}
                <Text fontWeight="700" color="$primaryDark">
                  {estabelecimentoSugerido.nome}
                </Text>
                ?
              </Text>
              <Button
                onPress={() => {
                  setEstabelecimentoId(estabelecimentoSugerido.id);
                  setEstabelecimentoNome(estabelecimentoSugerido.nome);
                  setEstabelecimentoSugerido(null);
                }}
                size="$2"
                backgroundColor="$primary"
                color="white"
                fontWeight="700"
                fontSize={12}
                borderRadius={999}
              >
                Usar
              </Button>
            </XStack>
          )}

          <YStack gap="$2">
            <Text fontSize={13} color="$textSecondary">
              Tags
            </Text>
            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <TagInput value={field.value ?? []} onChange={field.onChange} />
              )}
            />
          </YStack>
        </FormCard>

        <FormCard title="Comentário">
          <Controller
            control={control}
            name="comentario"
            render={({ field }) => (
              <AppInput value={field.value} onChangeText={field.onChange} placeholder="Opcional" />
            )}
          />
        </FormCard>
      </ScrollView>
    </Screen>
  );
}
