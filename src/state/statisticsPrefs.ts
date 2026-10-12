import type { SpendingBasis } from '@/domain/statistics/types';

/**
 * Preferências da tela de Estatísticas lembradas enquanto o app está
 * aberto (feature 003 — spec Assumptions): variáveis de módulo, sem
 * persistência, lidas como valor inicial do `useState` da tela para
 * sobreviver ao desmonte ao voltar para a Início.
 */
export type CategoryView = 'lista' | 'grafico';

let basis: SpendingBasis = 'minha';
let categoryView: CategoryView = 'lista';

export const statisticsPrefs = {
  getBasis: (): SpendingBasis => basis,
  setBasis: (value: SpendingBasis) => {
    basis = value;
  },
  getCategoryView: (): CategoryView => categoryView,
  setCategoryView: (value: CategoryView) => {
    categoryView = value;
  },
};
