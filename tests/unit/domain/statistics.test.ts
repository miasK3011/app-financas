import { resolveResponsibility } from '@/domain/expenseSplitting/resolveResponsibility';
import { compareToPrevious } from '@/domain/statistics/compareToPrevious';
import { idealSpendComparison } from '@/domain/statistics/idealSpendComparison';
import { resolvePeriod } from '@/domain/statistics/resolvePeriod';
import { spendingByCategory } from '@/domain/statistics/spendingByCategory';
import { subscriptionsShare } from '@/domain/statistics/subscriptionsShare';
import { topExpenses } from '@/domain/statistics/topExpenses';
import { totalSpent } from '@/domain/statistics/totalSpent';
import type { ParcelaComCompra } from '@/domain/statistics/types';

function parcela(
  overrides: Partial<ParcelaComCompra['compra']> & { valorResponsabilidade: number },
): ParcelaComCompra {
  const { valorResponsabilidade, ...compraOverrides } = overrides;
  return {
    parcelaId: 'parcela-' + Math.random(),
    valorResponsabilidade,
    compra: {
      id: 'compra-' + Math.random(),
      descricao: 'Compra',
      categoriaId: null,
      origem: 'MANUAL',
      ...compraOverrides,
    },
  };
}

describe('resolvePeriod', () => {
  it('derives the current and previous month for MENSAL', () => {
    const { current, previous } = resolvePeriod('MENSAL', new Date(2026, 9, 15));
    expect(current.start).toEqual(new Date(2026, 9, 1, 0, 0, 0, 0));
    expect(current.end.getMonth()).toBe(9);
    expect(previous.start).toEqual(new Date(2026, 8, 1, 0, 0, 0, 0));
    expect(previous.end.getMonth()).toBe(8);
  });

  it('derives the current and previous year for ANUAL', () => {
    const { current, previous } = resolvePeriod('ANUAL', new Date(2026, 9, 15));
    expect(current.start.getFullYear()).toBe(2026);
    expect(previous.start.getFullYear()).toBe(2025);
  });

  it('derives the current and previous day for DIARIO', () => {
    const { current, previous } = resolvePeriod('DIARIO', new Date(2026, 9, 15));
    expect(current.start.getDate()).toBe(15);
    expect(previous.start.getDate()).toBe(14);
  });

  it('derives a Monday-starting week for SEMANAL', () => {
    const { current } = resolvePeriod('SEMANAL', new Date(2026, 9, 15)); // quinta-feira
    expect(current.start.getDay()).toBe(1); // segunda
  });
});

describe('totalSpent', () => {
  it('sums valorResponsabilidade, not the raw parcela value', () => {
    const parcelas = [
      parcela({ valorResponsabilidade: 1000 }),
      parcela({ valorResponsabilidade: 500 }),
    ];
    expect(totalSpent(parcelas)).toBe(1500);
  });

  it('returns 0 for an empty period', () => {
    expect(totalSpent([])).toBe(0);
  });
});

describe('compareToPrevious', () => {
  it('computes the percent variation between two totals', () => {
    expect(compareToPrevious(1500, 1000)).toEqual({ percent: 0.5 });
  });

  it('returns null when there is no previous-period data (FR-041 Edge Case)', () => {
    expect(compareToPrevious(1500, null)).toBeNull();
  });

  it('returns null instead of dividing by a zero previous total', () => {
    expect(compareToPrevious(1500, 0)).toBeNull();
  });
});

describe('spendingByCategory', () => {
  it('groups by categoriaId, summing valorResponsabilidade', () => {
    const parcelas = [
      parcela({ valorResponsabilidade: 1000, categoriaId: 'cat-1' }),
      parcela({ valorResponsabilidade: 500, categoriaId: 'cat-1' }),
      parcela({ valorResponsabilidade: 300, categoriaId: 'cat-2' }),
      parcela({ valorResponsabilidade: 200, categoriaId: null }),
    ];
    const result = spendingByCategory(parcelas);
    expect(result).toEqual(
      expect.arrayContaining([
        { categoriaId: 'cat-1', total: 1500 },
        { categoriaId: 'cat-2', total: 300 },
        { categoriaId: null, total: 200 },
      ]),
    );
  });
});

describe('topExpenses', () => {
  it('sorts by valorResponsabilidade descending and applies the limit', () => {
    const parcelas = [
      parcela({ valorResponsabilidade: 100 }),
      parcela({ valorResponsabilidade: 900 }),
      parcela({ valorResponsabilidade: 500 }),
    ];
    const result = topExpenses(parcelas, 2);
    expect(result.map((p) => p.valorResponsabilidade)).toEqual([900, 500]);
  });
});

describe('subscriptionsShare', () => {
  it('sums only ASSINATURA-origin parcelas and computes their share of the total', () => {
    const parcelas = [
      parcela({ valorResponsabilidade: 4000, origem: 'MANUAL' }),
      parcela({ valorResponsabilidade: 1000, origem: 'ASSINATURA' }),
    ];
    const result = subscriptionsShare(parcelas, 5000);
    expect(result).toEqual({ subscriptionsTotal: 1000, percent: 0.2 });
  });

  it('returns percent 0 instead of dividing by a zero total', () => {
    expect(subscriptionsShare([], 0)).toEqual({ subscriptionsTotal: 0, percent: 0 });
  });
});

describe('idealSpendComparison', () => {
  it('computes goalAmount and used ratio when income and goal are configured', () => {
    const result = idealSpendComparison(3500, 5000, 0.7);
    expect(result).toEqual({ used: 1, goalAmount: 3500 });
  });

  it('returns null when there is no income configured (FR-042 Edge Case)', () => {
    expect(idealSpendComparison(3500, null, 0.7)).toBeNull();
  });

  it('returns null when there is no goal configured (FR-042 Edge Case)', () => {
    expect(idealSpendComparison(3500, 5000, null)).toBeNull();
  });
});

describe('US12 — a purchase split with someone else (FR-054)', () => {
  it('totalSpent/spendingByCategory/topExpenses all reflect the split share, not the full compra value', () => {
    // Compra de R$100 dividida ao meio (resolveResponsibility, como o
    // repositório calcularia antes de persistir Parcela.valorResponsabilidade).
    const responsabilidadeEfetiva = resolveResponsibility(
      { valorTotalOriginal: 10000, valorResponsabilidade: 5000 },
      [],
    );
    expect(responsabilidadeEfetiva).toBe(5000);

    const parcelas: ParcelaComCompra[] = [
      parcela({ valorResponsabilidade: responsabilidadeEfetiva, categoriaId: 'cat-1' }),
      parcela({ valorResponsabilidade: 2000, categoriaId: 'cat-1' }),
    ];

    expect(totalSpent(parcelas)).toBe(7000); // 5000 + 2000, nunca 10000 + 2000
    expect(spendingByCategory(parcelas)).toEqual([{ categoriaId: 'cat-1', total: 7000 }]);
    expect(topExpenses(parcelas, 1)[0].valorResponsabilidade).toBe(5000);
  });
});
