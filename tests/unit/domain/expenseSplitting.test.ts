import {
  InvalidResponsibilityError,
  validateManualResponsibility,
} from '@/domain/expenseSplitting/validateManualResponsibility';
import { requiresMotivoResponsavelFields } from '@/domain/expenseSplitting/requiresMotivoResponsavelFields';
import { resolveResponsibility } from '@/domain/expenseSplitting/resolveResponsibility';
import { shouldShowResponsibilitySummary } from '@/domain/expenseSplitting/shouldShowResponsibilitySummary';

describe('validateManualResponsibility', () => {
  it('accepts a value between 0 and the total, inclusive', () => {
    expect(() => validateManualResponsibility(3500, 7000)).not.toThrow();
    expect(() => validateManualResponsibility(0, 7000)).not.toThrow();
    expect(() => validateManualResponsibility(7000, 7000)).not.toThrow();
  });

  it('rejects a negative value (FR-048)', () => {
    expect(() => validateManualResponsibility(-1, 7000)).toThrow(InvalidResponsibilityError);
  });

  it('rejects a value greater than the total (FR-048)', () => {
    expect(() => validateManualResponsibility(7001, 7000)).toThrow(InvalidResponsibilityError);
  });
});

describe('requiresMotivoResponsavelFields', () => {
  it('returns false when no manual value is set', () => {
    expect(requiresMotivoResponsavelFields(null, 7000)).toBe(false);
  });

  it('returns false when the manual value equals the total', () => {
    expect(requiresMotivoResponsavelFields(7000, 7000)).toBe(false);
  });

  it('returns true when the manual value differs from the total', () => {
    expect(requiresMotivoResponsavelFields(3500, 7000)).toBe(true);
  });
});

describe('shouldShowResponsibilitySummary', () => {
  it('returns false when total and totalResponsabilidade match', () => {
    expect(shouldShowResponsibilitySummary({ total: 7000, totalResponsabilidade: 7000 })).toBe(
      false,
    );
  });

  it('returns true when they differ', () => {
    expect(shouldShowResponsibilitySummary({ total: 7000, totalResponsabilidade: 3500 })).toBe(
      true,
    );
  });
});

describe('resolveResponsibility — full 3-way precedence', () => {
  it('falls back to valorTotalOriginal when nothing is defined (FR-049)', () => {
    const result = resolveResponsibility(
      { valorTotalOriginal: 7000, valorResponsabilidade: null },
      [],
    );
    expect(result).toBe(7000);
  });

  it('uses the manual value when only that is defined', () => {
    const result = resolveResponsibility(
      { valorTotalOriginal: 7000, valorResponsabilidade: 3500 },
      [],
    );
    expect(result).toBe(3500);
  });

  it('linked entries always win, even when a manual value is also set (Edge Case, FR-051)', () => {
    const result = resolveResponsibility(
      { valorTotalOriginal: 7000, valorResponsabilidade: 3500 },
      [{ valor: 2000 }],
    );
    expect(result).toBe(5000); // 7000 - 2000, ignora o manual 3500
  });

  it('sums multiple linked entries', () => {
    const result = resolveResponsibility(
      { valorTotalOriginal: 7000, valorResponsabilidade: null },
      [{ valor: 2000 }, { valor: 1000 }],
    );
    expect(result).toBe(4000);
  });

  it('clamps at 0 when linked entries exceed the total', () => {
    const result = resolveResponsibility(
      { valorTotalOriginal: 7000, valorResponsabilidade: null },
      [{ valor: 9000 }],
    );
    expect(result).toBe(0);
  });
});
