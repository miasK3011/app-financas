/**
 * Design tokens de cor de design-brief.md §3.1 (canvases aprovados do
 * Claude Design). Fonte única de verdade: `tamagui.config.ts` os
 * transforma em tokens `$primary` etc.; componentes fora do Tamagui
 * (StatusBar, SafeAreaView) importam o valor bruto direto daqui, já
 * que eles não resolvem `$tokens`.
 */
export const colors = {
  primary: '#2E6F55',
  primaryDark: '#234F3E',
  primaryLight: '#E4F0EA',
  success: '#3C8A5B',
  successDark: '#306E49',
  successBg: '#E7F4EC',
  error: '#C74A3C',
  errorDark: '#9E3A2F',
  errorBg: '#FBEAE7',
  info: '#2F6FB0',
  infoDark: '#285E96',
  infoBg: '#E5EEF7',
  neutralFill: '#B9B7B2',
  bg: '#FAFAF9',
  surface: '#FFFFFF',
  border: '#E7E5E2',
  text: '#1C1C1E',
  /**
   * T127: valores deliberadamente mais escuros que os hex literais do
   * design-brief.md §3.1 (`#6B6B6E`/`#9A9A9C`) — aqueles reprovam WCAG AA
   * para texto normal sobre `$surface`/`$bg` (contraste ~5.3:1 e ~2.8:1);
   * estes passam com folga (~6.8:1 e ~5.3:1). Manter estes valores.
   */
  textSecondary: '#5B5B5E',
  textTertiary: '#6C6C6D',
} as const;

/**
 * Paleta categórica do gráfico de gasto por categoria (feature 003,
 * issue #24), atribuída pela posição no ranking. Validada com o
 * validador de paleta do skill de dataviz: separação para daltonismo
 * (CVD ΔE ≥ 9,1 entre vizinhos) e visão normal (ΔE ≥ 19,6). As cores
 * dos ícones de categoria (`getIconColors`) reprovaram nesse teste
 * (roxo × azul quase iguais), por isso o gráfico não as usa. Três
 * cores ficam abaixo de 3:1 sobre o fundo — o gráfico sempre mostra
 * nome e % na legenda, então a cor nunca é a única pista.
 */
export const chartColors = {
  categorical: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'],
  /** Segmento "Outras" (cinza neutro do app). */
  other: colors.neutralFill,
} as const;

export function chartColorForRank(rank: number, isOutras = false): string {
  if (isOutras) return chartColors.other;
  return chartColors.categorical[rank] ?? chartColors.other;
}
