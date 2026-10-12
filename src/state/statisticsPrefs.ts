import type { SpendingBasis } from '@/domain/statistics/types';

/**
 * Preferência da tela de Estatísticas lembrada enquanto o app está
 * aberto (feature 003 — spec Assumptions): variável de módulo, sem
 * persistência, lida como valor inicial do `useState` da tela para
 * sobreviver ao desmonte ao voltar para a Início.
 */
let basis: SpendingBasis = 'minha';

export const statisticsPrefs = {
  getBasis: (): SpendingBasis => basis,
  setBasis: (value: SpendingBasis) => {
    basis = value;
  },
};
