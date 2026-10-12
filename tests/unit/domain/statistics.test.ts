import { resolveResponsibility } from '@/domain/expenseSplitting/resolveResponsibility';
import { compareToPrevious } from '@/domain/statistics/compareToPrevious';
import { idealSpendComparison } from '@/domain/statistics/idealSpendComparison';
import { resolvePeriod } from '@/domain/statistics/resolvePeriod';
import { spendingByCategory } from '@/domain/statistics/spendingByCategory';
import { subscriptionsShare } from '@/domain/statistics/subscriptionsShare';
import { topExpenses } from '@/domain/statistics/topExpenses';
import { amountOf } from '@/domain/statistics/amountOf';
import {
  formatSharePct,
  toCategoryShare,
  toCategoryShareFull,
} from '@/domain/statistics/categoryShare';
import { periodLabel } from '@/domain/statistics/periodLabel';
import { totalSpent } from '@/domain/statistics/totalSpent';
import type { ParcelaComCompra } from '@/domain/statistics/types';

function parcela(
  overrides: Partial<ParcelaComCompra['compra']> & {
    valorResponsabilidade: number;
    valor?: number;
  },
): ParcelaComCompra {
  const { valorResponsabilidade, valor, ...compraOverrides } = overrides;
  return {
    parcelaId: 'parcela-' + Math.random(),
    valor: valor ?? valorResponsabilidade,
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

describe('003/US1 — SpendingBasis (minha × global)', () => {
  // Compra de R$100 em que a parte do usuário é R$40 + uma sem divisão de R$20.
  const parcelas: ParcelaComCompra[] = [
    parcela({
      valor: 10000,
      valorResponsabilidade: 4000,
      categoriaId: 'cat-1',
      origem: 'ASSINATURA',
    }),
    parcela({ valor: 2000, valorResponsabilidade: 2000, categoriaId: 'cat-2' }),
  ];

  it('amountOf picks valorResponsabilidade for minha and valor for global', () => {
    expect(amountOf(parcelas[0], 'minha')).toBe(4000);
    expect(amountOf(parcelas[0], 'global')).toBe(10000);
  });

  it('defaults to minha, preserving the pre-003 behaviour', () => {
    expect(totalSpent(parcelas)).toBe(6000);
    expect(totalSpent(parcelas, 'minha')).toBe(6000);
    expect(totalSpent(parcelas, 'global')).toBe(12000);
  });

  it('spendingByCategory follows the basis', () => {
    expect(spendingByCategory(parcelas, 'global')).toEqual([
      { categoriaId: 'cat-1', total: 10000 },
      { categoriaId: 'cat-2', total: 2000 },
    ]);
    expect(spendingByCategory(parcelas, 'minha')).toEqual([
      { categoriaId: 'cat-1', total: 4000 },
      { categoriaId: 'cat-2', total: 2000 },
    ]);
  });

  it('topExpenses ranks by the basis amount', () => {
    const tied: ParcelaComCompra[] = [
      parcela({ valor: 10000, valorResponsabilidade: 1000, descricao: 'dividida' }),
      parcela({ valor: 3000, valorResponsabilidade: 3000, descricao: 'minha' }),
    ];
    expect(topExpenses(tied, 1, 'minha')[0].compra.descricao).toBe('minha');
    expect(topExpenses(tied, 1, 'global')[0].compra.descricao).toBe('dividida');
  });

  it('subscriptionsShare follows the basis', () => {
    expect(subscriptionsShare(parcelas, 12000, 'global')).toEqual({
      subscriptionsTotal: 10000,
      percent: 10000 / 12000,
    });
    expect(subscriptionsShare(parcelas, 6000).subscriptionsTotal).toBe(4000);
  });
});

describe('003/US4 — categoryShare', () => {
  const spending = (totals: number[]) =>
    totals.map((total, index) => ({ categoriaId: `cat-${index}`, total }));
  const sumPct = (list: { pct: number }[]) =>
    Math.round(list.reduce((acc, item) => acc + item.pct, 0) * 10) / 10;

  it('keeps the 5 largest and folds the rest into "Outras", last', () => {
    const result = toCategoryShare(spending([500, 8000, 300, 1200, 50, 2000, 900, 700]));
    expect(result).toHaveLength(6);
    expect(result.map((item) => item.total)).toEqual([8000, 2000, 1200, 900, 700, 850]);
    expect(result[5]).toMatchObject({ key: 'outras', isOutras: true, rank: 5 });
    expect(result.slice(0, 5).map((item) => item.rank)).toEqual([0, 1, 2, 3, 4]);
  });

  it('has no "Outras" when there are 5 categories or fewer', () => {
    const result = toCategoryShare(spending([300, 100, 600]));
    expect(result.map((item) => item.key)).toEqual(['cat-2', 'cat-0', 'cat-1']);
    expect(result.some((item) => item.isOutras)).toBe(false);
  });

  it('percentages always add up to exactly 100', () => {
    expect(sumPct(toCategoryShare(spending([1, 1, 1])))).toBe(100);
    expect(sumPct(toCategoryShare(spending([3333, 3333, 3334, 17, 9, 4, 1])))).toBe(100);
    expect(sumPct(toCategoryShareFull(spending([3333, 3333, 3334, 17, 9, 4, 1])))).toBe(100);
  });

  it('a single category is 100%', () => {
    expect(toCategoryShare(spending([4200]))).toEqual([
      { key: 'cat-0', categoriaId: 'cat-0', total: 4200, pct: 100, rank: 0, isOutras: false },
    ]);
  });

  it('returns [] when there is no spending, ignoring zero totals', () => {
    expect(toCategoryShare([])).toEqual([]);
    expect(toCategoryShare(spending([0, 0]))).toEqual([]);
    expect(toCategoryShare(spending([0, 500])).map((item) => item.key)).toEqual(['cat-1']);
  });

  it('uncategorised spending gets a stable key', () => {
    expect(toCategoryShare([{ categoriaId: null, total: 100 }])[0].key).toBe('sem-categoria');
  });

  it('toCategoryShareFull lists every category without folding', () => {
    const result = toCategoryShareFull(spending([500, 8000, 300, 1200, 50, 2000, 900, 700]));
    expect(result).toHaveLength(8);
    expect(result[7]).toMatchObject({ total: 50, rank: 7, isOutras: false });
  });
});

describe('003/US4 — rótulos', () => {
  it('formats share percentages with a decimal comma', () => {
    expect(formatSharePct(38.2)).toBe('38,2%');
    expect(formatSharePct(100)).toBe('100,0%');
  });

  it('labels each period kind for the detail header', () => {
    const anchor = new Date(2026, 9, 12);
    expect(periodLabel('DIARIO', resolvePeriod('DIARIO', anchor).current)).toBe('12/10/2026');
    expect(periodLabel('SEMANAL', resolvePeriod('SEMANAL', anchor).current)).toBe('12/10 – 18/10');
    expect(periodLabel('MENSAL', resolvePeriod('MENSAL', anchor).current)).toBe('Outubro 2026');
    expect(periodLabel('ANUAL', resolvePeriod('ANUAL', anchor).current)).toBe('2026');
  });
});
