import { suggestBestCard } from '@/domain/bestCard/suggestBestCard';

const today = new Date(2026, 9, 5); // 05/10/2026

describe('suggestBestCard', () => {
  it('picks the card whose invoice due date is furthest in the future', () => {
    const closesSoon = {
      id: 'card-early',
      diaFechamento: 6, // fecha amanhã — vence dia 13 (mesmo mês, diaVencimento >= diaFechamento)
      diaVencimento: 13,
      arquivadoEm: null,
      criadoEm: new Date(2026, 0, 1),
    };
    const closesLater = {
      id: 'card-late',
      diaFechamento: 28, // fecha bem mais tarde — vence dia 5 do mês seguinte
      diaVencimento: 5,
      arquivadoEm: null,
      criadoEm: new Date(2026, 0, 1),
    };

    const result = suggestBestCard([closesSoon, closesLater], today);
    expect(result?.cardId).toBe('card-late');
  });

  it('excludes archived cards from the ranking (FR-025)', () => {
    const archivedButBetter = {
      id: 'card-archived',
      diaFechamento: 28,
      diaVencimento: 5,
      arquivadoEm: new Date(2026, 5, 1),
      criadoEm: new Date(2026, 0, 1),
    };
    const activeCard = {
      id: 'card-active',
      diaFechamento: 6,
      diaVencimento: 13,
      arquivadoEm: null,
      criadoEm: new Date(2026, 0, 1),
    };

    const result = suggestBestCard([archivedButBetter, activeCard], today);
    expect(result?.cardId).toBe('card-active');
  });

  it('breaks an exact tie by the oldest criadoEm', () => {
    const newer = {
      id: 'card-newer',
      diaFechamento: 6,
      diaVencimento: 13,
      arquivadoEm: null,
      criadoEm: new Date(2026, 5, 1),
    };
    const older = {
      id: 'card-older',
      diaFechamento: 6,
      diaVencimento: 13,
      arquivadoEm: null,
      criadoEm: new Date(2026, 0, 1),
    };

    const result = suggestBestCard([newer, older], today);
    expect(result?.cardId).toBe('card-older');
  });

  it('returns null when there is no active card', () => {
    const onlyArchived = {
      id: 'card-archived',
      diaFechamento: 10,
      diaVencimento: 17,
      arquivadoEm: new Date(2026, 5, 1),
      criadoEm: new Date(2026, 0, 1),
    };
    expect(suggestBestCard([onlyArchived], today)).toBeNull();
  });
});
