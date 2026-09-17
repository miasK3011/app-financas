import { config as defaultConfig } from '@tamagui/config';
import { createFont, createTamagui } from 'tamagui';

/**
 * Design tokens from design-brief.md §3.1 (the approved Claude Design
 * canvases). These are additive, semantic tokens layered on top of
 * Tamagui's default numeric color/radius scale — components should
 * reference `$primary`, `$radiusLg`, etc. rather than raw hex values.
 */
const colorTokens = {
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
  textSecondary: '#5B5B5E',
  textTertiary: '#6C6C6D',
};

const radiusTokens = {
  lg: 20,
  md: 14,
};

// Manrope: sans body/UI face. Lora: serif, reserved for titles and
// monetary values only (design-brief.md §3.1). Both are loaded via
// expo-font in src/app/_layout.tsx (T027) under their exact
// @expo-google-fonts asset names (e.g. "Manrope_600SemiBold") — RN has
// no CSS-style weight resolution within one family, so `face` maps
// each numeric weight to the specific loaded font name Tamagui must
// use for that weight.
const headingFont = createFont({
  ...defaultConfig.fonts.heading,
  family: 'Lora_500Medium',
  face: {
    500: { normal: 'Lora_500Medium', italic: 'Lora_500Medium_Italic' },
    600: { normal: 'Lora_600SemiBold' },
    700: { normal: 'Lora_700Bold' },
  },
});

const bodyFont = createFont({
  ...defaultConfig.fonts.body,
  family: 'Manrope_400Regular',
  face: {
    400: { normal: 'Manrope_400Regular' },
    500: { normal: 'Manrope_500Medium' },
    600: { normal: 'Manrope_600SemiBold' },
    700: { normal: 'Manrope_700Bold' },
  },
});

const tamaguiConfig = createTamagui({
  ...defaultConfig,
  fonts: {
    ...defaultConfig.fonts,
    heading: headingFont,
    body: bodyFont,
  },
  tokens: {
    ...defaultConfig.tokens,
    color: {
      ...defaultConfig.tokens.color,
      ...colorTokens,
    },
    radius: {
      ...defaultConfig.tokens.radius,
      ...radiusTokens,
    },
  },
});

export type AppTamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}

export default tamaguiConfig;
