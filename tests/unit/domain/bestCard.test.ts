import { suggestBestCard } from '@/domain/bestCard/suggestBestCard';

const today = new Date(2026, 9, 5); // 05/10/2026

describe('suggestBestCard', () => {
  it('picks the card whose next closing date is furthest in the future', () => {
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

  it('ranks by proximity to closing, not by total carência until due date (issue #11)', () => {
    // Fechou ontem (04/10) — melhor dia de compra é fechamento + 1. Este cartão
    // deve ganhar mesmo tendo uma carência bem mais curta (e por isso um
    // vencimento bem mais próximo) que o outro cartão.
    const justClosedShortGrace = {
      id: 'card-just-closed',
      diaFechamento: 4, // fechou ontem — próximo fechamento: 04/11
      diaVencimento: 5, // carência de 1 dia — vence 05/11
      arquivadoEm: null,
      criadoEm: new Date(2026, 0, 1),
    };
    const farFromClosingHugeGrace = {
      id: 'card-far-from-closing',
      diaFechamento: 31, // fecha só daqui a 26 dias — próximo fechamento: 31/10
      diaVencimento: 30, // carência de 30 dias — vence 30/11, data mais tardia que 05/11, mas
      // seu PRÓXIMO fechamento (31/10) é mais cedo que o do outro cartão (04/11)
      arquivadoEm: null,
      criadoEm: new Date(2026, 0, 1),
    };

    const result = suggestBestCard([justClosedShortGrace, farFromClosingHugeGrace], today);
    expect(result?.cardId).toBe('card-just-closed');
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
