import { allocateInstallmentsToInvoices } from '@/domain/installments/allocateInstallmentsToInvoices';
import {
  InvalidInstallmentError,
  splitInstallments,
} from '@/domain/installments/splitInstallments';

describe('splitInstallments', () => {
  it('splits a simple R$300/3x purchase evenly', () => {
    const plan = splitInstallments({
      valorTotalOriginal: 30000,
      parcelasTotal: 3,
      parcelaAtual: 1,
      valorResponsabilidade: null,
    });
    expect(plan).toEqual([
      { numero: 1, valor: 10000, valorResponsabilidade: 10000 },
      { numero: 2, valor: 10000, valorResponsabilidade: 10000 },
      { numero: 3, valor: 10000, valorResponsabilidade: 10000 },
    ]);
  });

  it('generates only the remaining installments when parcelaAtual > 1 (in-progress purchase)', () => {
    const plan = splitInstallments({
      valorTotalOriginal: 120000,
      parcelasTotal: 12,
      parcelaAtual: 5,
      valorResponsabilidade: null,
    });
    expect(plan).toHaveLength(8);
    expect(plan[0].numero).toBe(5);
    expect(plan.at(-1)?.numero).toBe(12);
    expect(plan.every((p) => p.valor === 10000)).toBe(true);
  });

  it('absorbs the rounding remainder into the first generated installment', () => {
    const plan = splitInstallments({
      valorTotalOriginal: 10000,
      parcelasTotal: 3,
      parcelaAtual: 1,
      valorResponsabilidade: null,
    });
    // 10000 / 3 = 3333.33 -> base 3333, remainder 1
    expect(plan[0].valor).toBe(3334);
    expect(plan[1].valor).toBe(3333);
    expect(plan[2].valor).toBe(3333);
    expect(plan.reduce((sum, p) => sum + p.valor, 0)).toBe(10000);
  });

  it('throws InvalidInstallmentError when parcelaAtual > parcelasTotal (FR-005)', () => {
    expect(() =>
      splitInstallments({
        valorTotalOriginal: 60000,
        parcelasTotal: 6,
        parcelaAtual: 8,
        valorResponsabilidade: null,
      }),
    ).toThrow(InvalidInstallmentError);
  });

  it('throws InvalidInstallmentError when parcelaAtual < 1', () => {
    expect(() =>
      splitInstallments({
        valorTotalOriginal: 60000,
        parcelasTotal: 6,
        parcelaAtual: 0,
        valorResponsabilidade: null,
      }),
    ).toThrow(InvalidInstallmentError);
  });

  it('applies the same responsibility proportion to every installment (FR-055)', () => {
    // Compra de 3x R$90 (R$30 cada) com responsabilidade manual de R$60 no total.
    const plan = splitInstallments({
      valorTotalOriginal: 9000,
      parcelasTotal: 3,
      parcelaAtual: 1,
      valorResponsabilidade: 6000,
    });
    expect(plan.map((p) => p.valorResponsabilidade)).toEqual([2000, 2000, 2000]);
  });
});

describe('allocateInstallmentsToInvoices', () => {
  const card = { diaFechamento: 10 };

  it('allocates the first installment to the resolved cycle and rolls consecutively', () => {
    const plan = splitInstallments({
      valorTotalOriginal: 30000,
      parcelasTotal: 3,
      parcelaAtual: 1,
      valorResponsabilidade: null,
    });
    const allocations = allocateInstallmentsToInvoices(plan, card, new Date(2026, 9, 5));
    expect(allocations).toEqual([
      { numero: 1, year: 2026, month: 10 },
      { numero: 2, year: 2026, month: 11 },
      { numero: 3, year: 2026, month: 12 },
    ]);
  });

  it('rolls over the year boundary', () => {
    const plan = splitInstallments({
      valorTotalOriginal: 20000,
      parcelasTotal: 2,
      parcelaAtual: 1,
      valorResponsabilidade: null,
    });
    const allocations = allocateInstallmentsToInvoices(plan, card, new Date(2026, 11, 5));
    expect(allocations).toEqual([
      { numero: 1, year: 2026, month: 12 },
      { numero: 2, year: 2027, month: 1 },
    ]);
  });

  it('starts from the current cycle even for an in-progress purchase (parcelaAtual > 1)', () => {
    const plan = splitInstallments({
      valorTotalOriginal: 120000,
      parcelasTotal: 12,
      parcelaAtual: 5,
      valorResponsabilidade: null,
    });
    const allocations = allocateInstallmentsToInvoices(plan, card, new Date(2026, 9, 5));
    expect(allocations[0]).toEqual({ numero: 5, year: 2026, month: 10 });
    expect(allocations.at(-1)).toEqual({ numero: 12, year: 2027, month: 5 });
  });
});
