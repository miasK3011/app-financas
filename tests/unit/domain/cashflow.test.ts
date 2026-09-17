import { computeMonthBalance } from '@/domain/cashflow/computeMonthBalance';

describe('computeMonthBalance', () => {
  it('reflects an updated renda mensal immediately (US2 cenário 1)', () => {
    const base = { entradasAvulsas: [], comprasPix: [], faturasVencendo: [] };
    expect(computeMonthBalance({ ...base, rendaVigente: 300000 })).toBe(300000);
    expect(computeMonthBalance({ ...base, rendaVigente: 350000 })).toBe(350000);
  });

  it('adds an entrada avulsa exactly (US2 cenário 2 — R$20 freela)', () => {
    const balance = computeMonthBalance({
      rendaVigente: 300000,
      entradasAvulsas: [2000],
      comprasPix: [],
      faturasVencendo: [],
    });
    expect(balance).toBe(302000);
  });

  it('subtracts a Pix purchase exactly (US2 cenário 3)', () => {
    const balance = computeMonthBalance({
      rendaVigente: 300000,
      entradasAvulsas: [],
      comprasPix: [8000],
      faturasVencendo: [],
    });
    expect(balance).toBe(292000);
  });

  it('subtracts invoices due in the month (FR-015)', () => {
    const balance = computeMonthBalance({
      rendaVigente: 300000,
      entradasAvulsas: [2000],
      comprasPix: [8000],
      faturasVencendo: [124530],
    });
    expect(balance).toBe(300000 + 2000 - 8000 - 124530);
  });

  it('treats a missing renda as zero, never throwing', () => {
    expect(
      computeMonthBalance({
        rendaVigente: null,
        entradasAvulsas: [1000],
        comprasPix: [],
        faturasVencendo: [],
      }),
    ).toBe(1000);
  });
});
