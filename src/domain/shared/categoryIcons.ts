/**
 * Lista curada de ícones lucide oferecidos no seletor de "Nova
 * Categoria" (FR-028) — o lucide tem milhares de ícones, uma lista
 * curta e temática é mais usável do que expor a biblioteca inteira.
 * Cada nome aqui precisa existir como export de `lucide-react-native`.
 */
export const CATEGORY_ICON_OPTIONS = [
  'ShoppingBag',
  'Car',
  'Utensils',
  'Repeat',
  'HeartPulse',
  'Gamepad2',
  'Shapes',
  'Home',
  'GraduationCap',
  'Plane',
  'PawPrint',
  'Gift',
  'Receipt',
  'Wrench',
  'Baby',
  'Dumbbell',
  'Coffee',
  'Fuel',
  'Shirt',
  'Smartphone',
] as const;

/**
 * issue #5 (auditoria de fidelidade visual, achado #1): os mockups
 * (`design/categorias-e-estabelecimentos/Main.dc.html`,
 * `CategoriaCriar.dc.html`, etc.) dão um fundo colorido distinto a cada
 * ícone — nunca o mesmo tom pra todas as categorias/estabelecimentos.
 * Os 8 pares abaixo são os hex exatos usados nos mockups; os 8 ícones
 * com correspondência direta (Utensils=Alimentação, Car=Transporte...)
 * usam o par certo, os demais ciclam pela mesma paleta por hash do nome
 * — mantém a variedade visual sem inventar cores fora da paleta aprovada.
 */
const ICON_COLOR_PALETTE: readonly { bg: string; fg: string }[] = [
  { bg: '#FDEDE3', fg: '#C9702C' },
  { bg: '#E3EAF7', fg: '#3E63A6' },
  { bg: '#F1E7F7', fg: '#7A4FA0' },
  { bg: '#FBE6E9', fg: '#B23A55' },
  { bg: '#E7F4EC', fg: '#306E49' },
  { bg: '#E1F0F3', fg: '#2C8FA0' },
  { bg: '#ECECEA', fg: '#6B6B6E' },
  { bg: '#EFEAF9', fg: '#6E56A8' },
] as const;

const ICON_COLOR_OVERRIDES: Record<string, number> = {
  Utensils: 0,
  Car: 1,
  ShoppingBag: 2,
  Repeat: 3,
  HeartPulse: 4,
  Gamepad2: 5,
  Shapes: 6,
  PawPrint: 7,
};

export function getIconColors(iconName: string | null | undefined): { bg: string; fg: string } {
  const name = iconName ?? 'Shapes';
  const overrideIndex = ICON_COLOR_OVERRIDES[name];
  if (overrideIndex !== undefined) return ICON_COLOR_PALETTE[overrideIndex];

  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return ICON_COLOR_PALETTE[hash % ICON_COLOR_PALETTE.length];
}
