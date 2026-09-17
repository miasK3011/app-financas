import { centsToReais, formatBRL, reaisToCents } from '@/domain/shared/money';

describe('money', () => {
  it('converts reais to cents without floating point drift', () => {
    expect(reaisToCents(70)).toBe(7000);
    expect(reaisToCents(30.1)).toBe(3010);
  });

  it('converts cents back to reais', () => {
    expect(centsToReais(7000)).toBe(70);
  });

  it('formats cents as BRL currency', () => {
    expect(formatBRL(700030)).toBe('R$ 7.000,30');
  });
});
