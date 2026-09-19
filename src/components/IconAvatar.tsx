import type { ComponentType } from 'react';
import { XStack } from 'tamagui';

import { getIconColors } from '@/domain/shared/categoryIcons';

type IconProps = { size?: number; color?: string };

export type IconAvatarProps = {
  icon: ComponentType<IconProps>;
  /** Nome do ícone lucide (chave da paleta de cores) — `null`/ausente cai no cinza de "Outros". */
  iconName?: string | null;
  size?: number;
};

/**
 * Círculo colorido por ícone (issue #5, achado #1) — mesma paleta usada
 * nos mockups de Categorias/Estabelecimentos, reaproveitado em toda
 * listagem/seletor de categoria ou estabelecimento do app.
 */
export function IconAvatar({ icon: Icon, iconName, size = 38 }: IconAvatarProps) {
  const { bg, fg } = getIconColors(iconName);
  return (
    <XStack
      width={size}
      height={size}
      borderRadius={size / 2}
      backgroundColor={bg}
      alignItems="center"
      justifyContent="center"
    >
      <Icon size={size * 0.5} color={fg} />
    </XStack>
  );
}
