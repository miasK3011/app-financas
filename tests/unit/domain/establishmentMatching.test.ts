import { matchEstablishment } from '@/domain/establishmentMatching/matchEstablishment';
import { reevaluateUnassignedTransactions } from '@/domain/establishmentMatching/reevaluateUnassignedTransactions';
import { suggestInitialPattern } from '@/domain/establishmentMatching/suggestInitialPattern';

describe('matchEstablishment', () => {
  it('returns null when no pattern matches', () => {
    const result = matchEstablishment('Pizzaria Napoli', [
      { estabelecimentoId: 'e1', texto: 'Uber', estabelecimentoCriadoEm: new Date(2026, 0, 1) },
    ]);
    expect(result).toBeNull();
  });

  it('matches case-insensitively by substring', () => {
    const result = matchEstablishment('UBER *TRIP 38220SP', [
      { estabelecimentoId: 'e1', texto: 'uber', estabelecimentoCriadoEm: new Date(2026, 0, 1) },
    ]);
    expect(result).toBe('e1');
  });

  it('breaks a tie between two matches by the longer pattern (Edge Case)', () => {
    const result = matchEstablishment('IFOOD *PIZZARIA NAPOLI', [
      { estabelecimentoId: 'ifood', texto: 'IFOOD', estabelecimentoCriadoEm: new Date(2026, 0, 1) },
      {
        estabelecimentoId: 'napoli',
        texto: 'IFOOD *PIZZARIA',
        estabelecimentoCriadoEm: new Date(2026, 0, 1),
      },
    ]);
    expect(result).toBe('napoli');
  });

  it('breaks a same-length tie by the oldest estabelecimentoCriadoEm (Edge Case)', () => {
    const result = matchEstablishment('LOJA XYZ', [
      { estabelecimentoId: 'newer', texto: 'LOJA', estabelecimentoCriadoEm: new Date(2026, 5, 1) },
      { estabelecimentoId: 'older', texto: 'LOJA', estabelecimentoCriadoEm: new Date(2026, 0, 1) },
    ]);
    expect(result).toBe('older');
  });
});

describe('reevaluateUnassignedTransactions', () => {
  it('returns only the compraId of matching, non-manually-assigned transactions', () => {
    const result = reevaluateUnassignedTransactions({ texto: 'Uber' }, [
      { compraId: 'c1', descricao: 'UBER *TRIP', estabelecimentoManual: false },
      { compraId: 'c2', descricao: 'Padaria Central', estabelecimentoManual: false },
    ]);
    expect(result).toEqual(['c1']);
  });

  it('never overrides a manually-assigned transaction (FR-034 Edge Case)', () => {
    const result = reevaluateUnassignedTransactions({ texto: 'Uber' }, [
      { compraId: 'c1', descricao: 'UBER *TRIP', estabelecimentoManual: true },
    ]);
    expect(result).toEqual([]);
  });

  it('matches case-insensitively', () => {
    const result = reevaluateUnassignedTransactions({ texto: 'uber' }, [
      { compraId: 'c1', descricao: 'UBER *TRIP', estabelecimentoManual: false },
    ]);
    expect(result).toEqual(['c1']);
  });
});

describe('suggestInitialPattern', () => {
  it('uppercases the description', () => {
    expect(suggestInitialPattern('Pizzaria Napoli')).toBe('PIZZARIA NAPOLI');
  });

  it('strips a trailing terminal/store suffix like "*38220SP"', () => {
    expect(suggestInitialPattern('Uber *38220SP')).toBe('UBER');
  });

  it('trims residual trailing punctuation', () => {
    expect(suggestInitialPattern('Padaria Central -')).toBe('PADARIA CENTRAL');
  });
});
