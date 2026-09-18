import { computeInvoiceDates } from '@/domain/invoices/computeInvoiceDates';
import { computeInvoiceStatus } from '@/domain/invoices/computeInvoiceStatus';
import { computeInvoiceTotals } from '@/domain/invoices/computeInvoiceTotals';
import { demoteFutureOpenInvoices } from '@/domain/invoices/demoteFutureOpenInvoices';
import { resolveInvoicePeriod } from '@/domain/invoices/resolveInvoicePeriod';

describe('resolveInvoicePeriod', () => {
  const closingDay = 10;

  it('falls in the current cycle when the purchase is before closing day', () => {
    expect(resolveInvoicePeriod(closingDay, new Date(2026, 9, 5))).toEqual({
      year: 2026,
      month: 10,
    });
  });

  it('falls in the current cycle when the purchase is exactly on closing day', () => {
    expect(resolveInvoicePeriod(closingDay, new Date(2026, 9, 10))).toEqual({
      year: 2026,
      month: 10,
    });
  });

  it('falls in the next cycle when the purchase is one day after closing', () => {
    expect(resolveInvoicePeriod(closingDay, new Date(2026, 9, 11))).toEqual({
      year: 2026,
      month: 11,
    });
  });

  it('rolls over into the next year in December', () => {
    expect(resolveInvoicePeriod(closingDay, new Date(2026, 11, 11))).toEqual({
      year: 2027,
      month: 1,
    });
  });
});

describe('computeInvoiceDates', () => {
  it('keeps the due date in the same month when diaVencimento >= diaFechamento', () => {
    const { dataFechamento, dataVencimento } = computeInvoiceDates(
      { diaFechamento: 10, diaVencimento: 17 },
      2026,
      10,
    );
    expect(dataFechamento.getMonth()).toBe(9);
    expect(dataFechamento.getDate()).toBe(10);
    expect(dataVencimento.getMonth()).toBe(9);
    expect(dataVencimento.getDate()).toBe(17);
  });

  it('rolls the due date into the next month when diaVencimento < diaFechamento', () => {
    const { dataVencimento } = computeInvoiceDates(
      { diaFechamento: 25, diaVencimento: 5 },
      2026,
      10,
    );
    expect(dataVencimento.getMonth()).toBe(10); // November
    expect(dataVencimento.getDate()).toBe(5);
  });

  it('rolls the due date into January of the next year from a December closing', () => {
    const { dataVencimento } = computeInvoiceDates(
      { diaFechamento: 25, diaVencimento: 5 },
      2026,
      12,
    );
    expect(dataVencimento.getFullYear()).toBe(2027);
    expect(dataVencimento.getMonth()).toBe(0);
  });
});

describe('computeInvoiceStatus', () => {
  it('returns PAGA whenever pagaEm is set, regardless of dates', () => {
    const status = computeInvoiceStatus(
      { pagaEm: new Date(2026, 9, 1), dataFechamento: new Date(2026, 9, 10) },
      new Date(2026, 9, 5),
    );
    expect(status).toBe('PAGA');
  });

  it('returns FECHADA when today is after the closing date', () => {
    const status = computeInvoiceStatus(
      { pagaEm: null, dataFechamento: new Date(2026, 9, 10) },
      new Date(2026, 9, 11),
    );
    expect(status).toBe('FECHADA');
  });

  it('returns ABERTA when today is on or before the closing date', () => {
    const status = computeInvoiceStatus(
      { pagaEm: null, dataFechamento: new Date(2026, 9, 10) },
      new Date(2026, 9, 10),
    );
    expect(status).toBe('ABERTA');
  });

  it('returns ABERTA for the whole closing day, not just at exact midnight (regression)', () => {
    // Bug real: comparar o timestamp completo de `today` (em vez de
    // truncar ao dia) fazia a fatura virar FECHADA a partir de
    // 00:00:01 do próprio dia de fechamento.
    const status = computeInvoiceStatus(
      { pagaEm: null, dataFechamento: new Date(2026, 9, 10) },
      new Date(2026, 9, 10, 23, 59, 59),
    );
    expect(status).toBe('ABERTA');
  });

  it('returns FECHADA starting midnight of the day after closing', () => {
    const status = computeInvoiceStatus(
      { pagaEm: null, dataFechamento: new Date(2026, 9, 10) },
      new Date(2026, 9, 11, 0, 0, 1),
    );
    expect(status).toBe('FECHADA');
  });
});

describe('demoteFutureOpenInvoices', () => {
  it('keeps only the earliest-closing ABERTA invoice per card as ABERTA, demoting the rest to FUTURA', () => {
    const result = demoteFutureOpenInvoices([
      { id: '1', cartaoId: 'c1', dataFechamento: new Date(2026, 9, 10), status: 'ABERTA' },
      { id: '2', cartaoId: 'c1', dataFechamento: new Date(2026, 10, 10), status: 'ABERTA' },
      { id: '3', cartaoId: 'c1', dataFechamento: new Date(2026, 11, 10), status: 'ABERTA' },
    ]);
    expect(result.map((invoice) => invoice.status)).toEqual(['ABERTA', 'FUTURA', 'FUTURA']);
  });

  it('does not touch FECHADA/PAGA invoices, and treats each card independently', () => {
    const result = demoteFutureOpenInvoices([
      { id: '1', cartaoId: 'c1', dataFechamento: new Date(2026, 8, 10), status: 'FECHADA' },
      { id: '2', cartaoId: 'c1', dataFechamento: new Date(2026, 9, 10), status: 'ABERTA' },
      { id: '3', cartaoId: 'c2', dataFechamento: new Date(2026, 9, 10), status: 'ABERTA' },
      { id: '4', cartaoId: 'c2', dataFechamento: new Date(2026, 10, 10), status: 'ABERTA' },
    ]);
    expect(result.map((invoice) => invoice.status)).toEqual([
      'FECHADA',
      'ABERTA',
      'ABERTA',
      'FUTURA',
    ]);
  });

  it('is a no-op when a card has a single open invoice', () => {
    const result = demoteFutureOpenInvoices([
      { id: '1', cartaoId: 'c1', dataFechamento: new Date(2026, 9, 10), status: 'ABERTA' },
    ]);
    expect(result[0].status).toBe('ABERTA');
  });
});

describe('computeInvoiceTotals', () => {
  it('sums valor and valorResponsabilidade independently (FR-011, FR-053)', () => {
    const totals = computeInvoiceTotals([
      { valor: 3290, valorResponsabilidade: 3290 },
      { valor: 7000, valorResponsabilidade: 3000 },
    ]);
    expect(totals).toEqual({ total: 10290, totalResponsabilidade: 6290 });
  });

  it('returns zeros for an empty invoice', () => {
    expect(computeInvoiceTotals([])).toEqual({ total: 0, totalResponsabilidade: 0 });
  });
});
