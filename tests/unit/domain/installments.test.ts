import { allocateInstallmentsToInvoices } from '@/domain/installments/allocateInstallmentsToInvoices';
import { recomputeSplitOnRefund } from '@/domain/installments/recomputeSplitOnRefund';
import {
  InvalidInstallmentError,
  splitInstallments,
} from '@/domain/installments/splitInstallments';
import { resolveResponsibility } from '@/domain/expenseSplitting/resolveResponsibility';

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

describe('recomputeSplitOnRefund', () => {
  it('returns the full total when there is no linked entry', () => {
    expect(recomputeSplitOnRefund({ valorTotalOriginal: 7000 }, [])).toBe(7000);
  });

  it('subtracts a single linked entry from the total', () => {
    expect(recomputeSplitOnRefund({ valorTotalOriginal: 7000 }, [{ valor: 2000 }])).toBe(5000);
  });

  it('subtracts the sum of multiple linked entries', () => {
    const result = recomputeSplitOnRefund({ valorTotalOriginal: 7000 }, [
      { valor: 2000 },
      { valor: 1000 },
    ]);
    expect(result).toBe(4000);
  });

  it('clamps at 0 instead of going negative', () => {
    expect(recomputeSplitOnRefund({ valorTotalOriginal: 7000 }, [{ valor: 9000 }])).toBe(0);
  });

  it('unlinking the last entry falls back to the manual value, if any (Edge Case)', () => {
    // resolveResponsibility é quem decide isso na prática — recomputeSplitOnRefund
    // sozinha não conhece o valor manual, só o ramo "com entradas vinculadas".
    const compra = { valorTotalOriginal: 7000, valorResponsabilidade: 3500 };
    expect(resolveResponsibility(compra, [])).toBe(3500);
  });

  it('unlinking the last entry falls back to the total when there is no manual value (Edge Case)', () => {
    const compra = { valorTotalOriginal: 7000, valorResponsabilidade: null };
    expect(resolveResponsibility(compra, [])).toBe(7000);
  });
});
