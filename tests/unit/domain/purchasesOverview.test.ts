import { groupByDay } from '@/domain/purchasesOverview/groupByDay';
import { computeMonthRange } from '@/domain/purchasesOverview/monthRange';
import { computeBreakdown } from '@/domain/purchasesOverview/paymentBreakdown';
import type { PurchaseListRow } from '@/domain/purchasesOverview/types';

function row(overrides: Partial<PurchaseListRow>): PurchaseListRow {
  return {
    parcelaId: 'parcela-1',
    compraId: 'compra-1',
    descricao: 'Compra',
    categoria: null,
    valor: 1000,
    formaPagamento: 'PIX',
    nomeCartao: null,
    parcela: null,
    dataCompra: new Date(2026, 8, 19),
    ...overrides,
  };
}

describe('groupByDay', () => {
  const today = new Date(2026, 8, 19); // 19 de setembro de 2026

  it('labels the anchor day as "Hoje"', () => {
    const groups = groupByDay([row({ dataCompra: today })], today);
    expect(groups).toEqual([{ label: 'Hoje', rows: [row({ dataCompra: today })] }]);
  });

  it('labels the previous day as "Ontem"', () => {
    const yesterday = new Date(2026, 8, 18);
    const groups = groupByDay([row({ dataCompra: yesterday })], today);
    expect(groups[0].label).toBe('Ontem');
  });

  it('labels any other day as "{d} de {mês por extenso}"', () => {
    const olderDay = new Date(2026, 8, 17);
    const groups = groupByDay([row({ dataCompra: olderDay })], today);
    expect(groups[0].label).toBe('17 de setembro');
  });

  it('groups rows from the same calendar day together, preserving input order', () => {
    const first = row({ parcelaId: 'a', dataCompra: today });
    const second = row({ parcelaId: 'b', dataCompra: today });
    const groups = groupByDay([first, second], today);
    expect(groups).toHaveLength(1);
    expect(groups[0].rows.map((r) => r.parcelaId)).toEqual(['a', 'b']);
  });

  it('creates a separate group per distinct day, in the input order', () => {
    const today19 = row({ parcelaId: 'a', dataCompra: today });
    const day17 = row({ parcelaId: 'b', dataCompra: new Date(2026, 8, 17) });
    const groups = groupByDay([today19, day17], today);
    expect(groups.map((g) => g.label)).toEqual(['Hoje', '17 de setembro']);
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

  it('returns zero total with an empty array for no rows', () => {
    expect(computeBreakdown([])).toEqual({ total: 0, porFormaPagamento: [] });
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
