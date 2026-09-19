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
