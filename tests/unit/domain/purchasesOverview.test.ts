import { groupByDay } from '@/domain/purchasesOverview/groupByDay';
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
