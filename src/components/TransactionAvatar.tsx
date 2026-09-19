import * as LucideIcons from 'lucide-react-native';
import { Shapes } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { Image } from 'react-native';

import { IconAvatar } from '@/components/IconAvatar';

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
  // Se o arquivo em cache sumir/corromper depois de salvo, `onError`
  // reseta pro fallback de ícone em vez de deixar um espaço em branco.
  // Guarda a própria URI que falhou (não um boolean solto) pra tentar
  // de novo automaticamente se essa mesma Compra/Estabelecimento vier
  // com uma URI diferente depois (ex.: logotipo recadastrado).
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const logoCachePath = estabelecimento?.logoCachePath ?? null;

  if (logoCachePath && logoCachePath !== failedUri) {
    return (
      <Image
        source={{ uri: logoCachePath }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        onError={() => setFailedUri(logoCachePath)}
      />
    );
  }

  const iconName = estabelecimento?.iconeRespaldo ?? categoria?.icone;
  const Icon = (iconName && icons[iconName]) || Shapes;

  return <IconAvatar icon={Icon} iconName={iconName} size={size} />;
}
