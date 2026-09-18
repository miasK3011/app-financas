import { monthlySubscriptionsTotal } from '@/domain/subscriptions/monthlySubscriptionsTotal';
import { pendingChargesFor } from '@/domain/subscriptions/pendingChargesFor';

const today = new Date(2026, 9, 15); // 15/10/2026

describe('pendingChargesFor', () => {
  it('generates a pending charge once diaCobranca is reached this month', () => {
    const netflix = {
      id: 'sub-1',
      diaCobranca: 10,
      dataInicio: new Date(2026, 0, 1),
      canceladaEm: null,
    };
    const result = pendingChargesFor([netflix], [], today);
    expect(result).toEqual([
      { assinaturaId: 'sub-1', year: 2026, month: 10, chargeDate: new Date(2026, 9, 10) },
    ]);
  });

  it('does not generate a charge before diaCobranca is reached this month', () => {
    const spotify = {
      id: 'sub-2',
      diaCobranca: 20,
      dataInicio: new Date(2026, 0, 1),
      canceladaEm: null,
    };
    expect(pendingChargesFor([spotify], [], today)).toEqual([]);
  });

  it('never generates twice for the same (assinaturaId, year, month) — idempotency', () => {
    const netflix = {
      id: 'sub-1',
      diaCobranca: 10,
      dataInicio: new Date(2026, 0, 1),
      canceladaEm: null,
    };
    const existingGenerated = [{ assinaturaId: 'sub-1', year: 2026, month: 10 }];
    expect(pendingChargesFor([netflix], existingGenerated, today)).toEqual([]);
  });

  it('excludes a canceled subscription', () => {
    const canceled = {
      id: 'sub-3',
      diaCobranca: 10,
      dataInicio: new Date(2026, 0, 1),
      canceladaEm: new Date(2026, 8, 1),
    };
    expect(pendingChargesFor([canceled], [], today)).toEqual([]);
  });

  it('excludes a subscription whose dataInicio is still in the future', () => {
    const notStartedYet = {
      id: 'sub-4',
      diaCobranca: 10,
      dataInicio: new Date(2026, 10, 1),
      canceladaEm: null,
    };
    expect(pendingChargesFor([notStartedYet], [], today)).toEqual([]);
  });

  it('clamps diaCobranca to the last day of a shorter month', () => {
    const dia31 = {
      id: 'sub-5',
      diaCobranca: 31,
      dataInicio: new Date(2026, 0, 1),
      canceladaEm: null,
    };
    const abril = new Date(2026, 3, 30); // 30/04/2026 — abril só tem 30 dias
    const result = pendingChargesFor([dia31], [], abril);
    expect(result).toEqual([
      { assinaturaId: 'sub-5', year: 2026, month: 4, chargeDate: new Date(2026, 3, 30) },
    ]);
  });
});

describe('monthlySubscriptionsTotal', () => {
  it('sums the valor of every active subscription', () => {
    const subscriptions = [
      { valor: 3990, canceladaEm: null },
      { valor: 2190, canceladaEm: null },
    ];
    expect(monthlySubscriptionsTotal(subscriptions)).toBe(6180);
  });

  it('excludes canceled subscriptions from the total', () => {
    const subscriptions = [
      { valor: 3990, canceladaEm: null },
      { valor: 2190, canceladaEm: new Date(2026, 5, 1) },
    ];
    expect(monthlySubscriptionsTotal(subscriptions)).toBe(3990);
  });

  it('returns 0 when there are no subscriptions', () => {
    expect(monthlySubscriptionsTotal([])).toBe(0);
  });
});
