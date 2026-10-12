import { balanceEntries } from '@/domain/cashflow/balanceEntries';
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

describe('003/US1 — saldo pela parte do usuário (FR-001/FR-001a)', () => {
  it('discounts only the user share of Pix purchases and due invoices', () => {
    expect(
      computeMonthBalance({
        rendaVigente: 500000,
        entradasAvulsas: [],
        comprasPix: [4000], // Pix de R$100, parte do usuário R$40
        faturasVencendo: [70000], // fatura de R$1.000, parte do usuário R$700
      }),
    ).toBe(426000);
  });

  it('does not count a linked refund twice', () => {
    // Compra Pix de R$100 com reembolso vinculado de R$60: parte = R$40.
    const entries = [
      { valor: 6000, compraVinculadaId: 'compra-1' },
      { valor: 2000, compraVinculadaId: null },
    ];
    expect(balanceEntries(entries)).toEqual([2000]);
    expect(
      computeMonthBalance({
        rendaVigente: 500000,
        entradasAvulsas: balanceEntries(entries),
        comprasPix: [4000],
        faturasVencendo: [],
      }),
    ).toBe(500000 + 2000 - 4000); // nunca 500000 + 2000 + 6000 - 4000
  });

  it('is unchanged for purchases without any split', () => {
    expect(
      computeMonthBalance({
        rendaVigente: 300000,
        entradasAvulsas: balanceEntries([{ valor: 2000, compraVinculadaId: null }]),
        comprasPix: [5000],
        faturasVencendo: [100000],
      }),
    ).toBe(197000);
  });
});
