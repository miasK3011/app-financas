import {
  applyPurchaseFilters,
  isUnfiltered,
  NO_FILTERS,
  toggleFormaPagamento,
  toggleSoMinhas,
} from '@/domain/purchasesOverview/filters';
import { groupByDay } from '@/domain/purchasesOverview/groupByDay';
import { computeMonthRange } from '@/domain/purchasesOverview/monthRange';
import { computeBreakdown } from '@/domain/purchasesOverview/paymentBreakdown';
import type { PurchaseListRow } from '@/domain/purchasesOverview/types';

function row(overrides: Partial<PurchaseListRow>): PurchaseListRow {
  return {
    compraId: 'compra-1',
    descricao: 'Compra',
    categoria: null,
    valor: 1000,
    valorResponsabilidade: overrides.valor ?? 1000,
    isSplit: false,
    formaPagamento: 'PIX',
    nomeCartao: null,
    parcelas: null,
    dataCompra: new Date(2026, 8, 19),
    ...overrides,
  };
}

const byDate = (r: PurchaseListRow) => r.dataCompra;

describe('groupByDay', () => {
  const today = new Date(2026, 8, 19); // 19 de setembro de 2026

  it('labels the anchor day as "Hoje"', () => {
    const groups = groupByDay([row({ dataCompra: today })], byDate, today);
    expect(groups).toEqual([{ label: 'Hoje', date: today, rows: [row({ dataCompra: today })] }]);
  });

  it('labels the previous day as "Ontem"', () => {
    const yesterday = new Date(2026, 8, 18);
    const groups = groupByDay([row({ dataCompra: yesterday })], byDate, today);
    expect(groups[0].label).toBe('Ontem');
  });

  it('labels any other day as "{d} de {mês por extenso}"', () => {
    const olderDay = new Date(2026, 8, 17);
    const groups = groupByDay([row({ dataCompra: olderDay })], byDate, today);
    expect(groups[0].label).toBe('17 de setembro');
  });

  it('groups rows from the same calendar day together, even at different times', () => {
    const morning = row({ compraId: 'a', dataCompra: new Date(2026, 8, 19, 9) });
    const night = row({ compraId: 'b', dataCompra: new Date(2026, 8, 19, 22) });
    const groups = groupByDay([morning, night], byDate, today);
    expect(groups).toHaveLength(1);
    expect(groups[0].rows.map((r) => r.compraId)).toEqual(['b', 'a']);
  });

  it('keeps input order for rows at the same instant (stable sort)', () => {
    const first = row({ compraId: 'a', dataCompra: today });
    const second = row({ compraId: 'b', dataCompra: today });
    const groups = groupByDay([first, second], byDate, today);
    expect(groups[0].rows.map((r) => r.compraId)).toEqual(['a', 'b']);
  });

  it('sorts out-of-order input newest first, without mutating it (FR-007)', () => {
    const day17 = row({ compraId: 'a', dataCompra: new Date(2026, 8, 17) });
    const day19 = row({ compraId: 'b', dataCompra: today });
    const day18 = row({ compraId: 'c', dataCompra: new Date(2026, 8, 18) });
    const input = [day17, day19, day18];
    const groups = groupByDay(input, byDate, today);
    expect(groups.map((g) => g.label)).toEqual(['Hoje', 'Ontem', '17 de setembro']);
    expect(input.map((r) => r.compraId)).toEqual(['a', 'b', 'c']);
  });

  it('groups any row shape through the date accessor', () => {
    const rows = [
      { id: 1, at: new Date(2026, 8, 10) },
      { id: 2, at: today },
    ];
    const groups = groupByDay(rows, (r) => r.at, today);
    expect(groups.map((g) => g.rows[0].id)).toEqual([2, 1]);
  });
});

describe('computeBreakdown', () => {
  it('sums the total across all rows', () => {
    const breakdown = computeBreakdown([
      row({ valor: 1000, formaPagamento: 'PIX' }),
      row({ valor: 2000, formaPagamento: 'CARTAO' }),
    ]);
    expect(breakdown.total).toBe(3000);
  });

  it('sums per forma de pagamento', () => {
    const breakdown = computeBreakdown([
      row({ valor: 1000, formaPagamento: 'PIX' }),
      row({ valor: 500, formaPagamento: 'PIX' }),
      row({ valor: 2000, formaPagamento: 'CARTAO' }),
    ]);
    expect(breakdown.porFormaPagamento).toEqual(
      expect.arrayContaining([
        { formaPagamento: 'PIX', total: 1500 },
        { formaPagamento: 'CARTAO', total: 2000 },
      ]),
    );
  });

  it('omits a forma de pagamento with a zero total', () => {
    const breakdown = computeBreakdown([row({ valor: 1000, formaPagamento: 'PIX' })]);
    expect(breakdown.porFormaPagamento).toEqual([{ formaPagamento: 'PIX', total: 1000 }]);
  });

  it('returns zero totals with an empty array for no rows', () => {
    expect(computeBreakdown([])).toEqual({
      total: 0,
      totalResponsabilidade: 0,
      porFormaPagamento: [],
    });
  });

  it('sums the user share separately (FR-009 da 003)', () => {
    const breakdown = computeBreakdown([
      row({ valor: 10000, valorResponsabilidade: 4000, isSplit: true }),
      row({ valor: 2000 }),
    ]);
    expect(breakdown.total).toBe(12000);
    expect(breakdown.totalResponsabilidade).toBe(6000);
  });
});

describe('applyPurchaseFilters (FR-008 da 003)', () => {
  const minhaPix = row({ compraId: 'minha-pix', formaPagamento: 'PIX' });
  const divididaCartao = row({
    compraId: 'dividida-cartao',
    formaPagamento: 'CARTAO',
    valor: 10000,
    valorResponsabilidade: 4000,
    isSplit: true,
  });
  const parteZero = row({
    compraId: 'parte-zero',
    formaPagamento: 'PIX',
    valor: 5000,
    valorResponsabilidade: 0,
    isSplit: true,
  });
  const rows = [minhaPix, divididaCartao, parteZero];
  const ids = (list: PurchaseListRow[]) => list.map((r) => r.compraId);

  it('returns everything with no active filter', () => {
    expect(ids(applyPurchaseFilters(rows, { formaPagamento: 'TODOS', soMinhas: false }))).toEqual([
      'minha-pix',
      'dividida-cartao',
      'parte-zero',
    ]);
  });

  it('"Só minhas" hides every split purchase, including a zero share', () => {
    expect(ids(applyPurchaseFilters(rows, { formaPagamento: 'TODOS', soMinhas: true }))).toEqual([
      'minha-pix',
    ]);
  });

  it('combines with the forma de pagamento filter', () => {
    expect(ids(applyPurchaseFilters(rows, { formaPagamento: 'CARTAO', soMinhas: false }))).toEqual([
      'dividida-cartao',
    ]);
    expect(ids(applyPurchaseFilters(rows, { formaPagamento: 'CARTAO', soMinhas: true }))).toEqual(
      [],
    );
    expect(ids(applyPurchaseFilters(rows, { formaPagamento: 'PIX', soMinhas: true }))).toEqual([
      'minha-pix',
    ]);
  });
});

describe('filter chip state', () => {
  it('"Todos" is active only when no other filter is', () => {
    expect(isUnfiltered(NO_FILTERS)).toBe(true);
    expect(isUnfiltered(toggleSoMinhas(NO_FILTERS))).toBe(false);
    expect(isUnfiltered(toggleFormaPagamento(NO_FILTERS, 'PIX'))).toBe(false);
  });

  it('Cartão/Pix are exclusive and tapping the active one goes back to Todos', () => {
    const cartao = toggleFormaPagamento(NO_FILTERS, 'CARTAO');
    expect(cartao.formaPagamento).toBe('CARTAO');
    expect(toggleFormaPagamento(cartao, 'PIX').formaPagamento).toBe('PIX');
    expect(toggleFormaPagamento(cartao, 'CARTAO')).toEqual(NO_FILTERS);
  });

  it('"Só minhas" combines with Cartão/Pix and toggles off', () => {
    const both = toggleSoMinhas(toggleFormaPagamento(NO_FILTERS, 'CARTAO'));
    expect(both).toEqual({ formaPagamento: 'CARTAO', soMinhas: true });
    expect(toggleSoMinhas(toggleSoMinhas(NO_FILTERS))).toEqual(NO_FILTERS);
  });
});

describe('computeMonthRange', () => {
  const today = new Date(2026, 8, 19); // 19 de setembro de 2026

  it('disables advancing past the current month when there is no future parcela', () => {
    const range = computeMonthRange(new Date(2026, 6, 1), [], today);
    expect(range.latest).toEqual({ year: 2026, month: 9 });
  });

  it('allows advancing up to the furthest month with a lançada parcela', () => {
    const range = computeMonthRange(
      new Date(2026, 6, 1),
      [new Date(2026, 9, 10), new Date(2026, 10, 10)],
      today,
    );
    expect(range.latest).toEqual({ year: 2026, month: 11 });
  });

  it('never goes back before the current month even with only past invoice dates', () => {
    const range = computeMonthRange(new Date(2026, 6, 1), [new Date(2026, 5, 10)], today);
    expect(range.latest).toEqual({ year: 2026, month: 9 });
  });

  it('leaves earliest undefined when there is no Compra cadastrada (estado vazio total)', () => {
    const range = computeMonthRange(null, [], today);
    expect(range.earliest).toBeUndefined();
    expect(range.latest).toEqual({ year: 2026, month: 9 });
  });

  it('sets earliest to the month of the oldest Compra', () => {
    const range = computeMonthRange(new Date(2025, 2, 14), [], today);
    expect(range.earliest).toEqual({ year: 2025, month: 3 });
  });
});
