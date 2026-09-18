import * as LucideIcons from 'lucide-react-native';
import { Shapes } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { Image } from 'react-native';
import { XStack } from 'tamagui';

type IconProps = { size?: number; color?: string };
const icons = LucideIcons as unknown as Record<string, ComponentType<IconProps>>;

export type TransactionAvatarProps = {
  /** `null`/ausente é o caso comum até a User Story 10 existir. */
  estabelecimento?: { logoCachePath: string | null; iconeRespaldo: string } | null;
  categoria?: { icone: string } | null;
  size?: number;
};

/**
 * FR-030: ordem de prioridade em toda listagem de transações —
 * (1) avatar do estabelecimento (logo em cache, senão seu ícone de
 * respaldo), (2) ícone da categoria, (3) ícone genérico "Outros".
 */
export function TransactionAvatar({
  estabelecimento,
  categoria,
  size = 38,
}: TransactionAvatarProps) {
  if (estabelecimento?.logoCachePath) {
    return (
      <Image
        source={{ uri: estabelecimento.logoCachePath }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  const iconName = estabelecimento?.iconeRespaldo ?? categoria?.icone;
  const Icon = (iconName && icons[iconName]) || Shapes;

  return (
    <XStack
      width={size}
      height={size}
      borderRadius={size / 2}
      backgroundColor="$primaryLight"
      alignItems="center"
      justifyContent="center"
    >
      <Icon size={size * 0.5} color="#234F3E" />
    </XStack>
  );
}
