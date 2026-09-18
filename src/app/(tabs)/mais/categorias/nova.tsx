import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import * as LucideIcons from 'lucide-react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button, ScrollView, Text, XStack, YStack } from 'tamagui';

import { AppInput } from '@/components/AppInput';
import { Screen } from '@/components/Screen';
import { CATEGORY_ICON_OPTIONS } from '@/domain/shared/categoryIcons';
import {
  type CategoryInput,
  categoryInputSchema,
  createCategory,
} from '@/repositories/categoriesRepository';

type IconProps = { size?: number; color?: string };
const icons = LucideIcons as unknown as Record<string, ComponentType<IconProps>>;

export default function CategoriaCriarScreen() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categoryInputSchema),
    defaultValues: { nome: '', icone: CATEGORY_ICON_OPTIONS[0] },
  });

  const selectedIcon = watch('icone');

  const onSubmit = handleSubmit(async (data) => {
    await createCategory(data);
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
          Nova categoria
        </Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
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
                placeholder="Ex.: Pets"
                error={Boolean(fieldState.error)}
              />
            )}
          />
          {errors.nome && (
            <Text fontSize={12} color="$error">
              Informe um nome
            </Text>
          )}
        </YStack>

        <YStack gap="$2">
          <Text fontSize={13} color="$textSecondary">
            Ícone
          </Text>
          <XStack flexWrap="wrap" gap="$2">
            {CATEGORY_ICON_OPTIONS.map((iconName) => {
              const Icon = icons[iconName];
              const selected = selectedIcon === iconName;
              return (
                <Button
                  key={iconName}
                  onPress={() => setValue('icone', iconName)}
                  width={48}
                  height={48}
                  circular
                  backgroundColor={selected ? '$primary' : '$surface'}
                  borderColor="$border"
                  borderWidth={1}
                  icon={<Icon size={20} color={selected ? 'white' : '#1C1C1E'} />}
                />
              );
            })}
          </XStack>
        </YStack>

        <Button
          onPress={onSubmit}
          disabled={isSubmitting}
          backgroundColor="$primary"
          color="white"
          fontWeight="700"
          borderRadius={999}
        >
          Salvar categoria
        </Button>
      </ScrollView>
    </Screen>
  );
}
