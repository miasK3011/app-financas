import { computeInvoiceDates } from '@/domain/invoices/computeInvoiceDates';
import { resolveInvoicePeriod } from '@/domain/invoices/resolveInvoicePeriod';

export type BestCardCandidate = {
  id: string;
  diaFechamento: number;
  diaVencimento: number;
  arquivadoEm: Date | null;
  criadoEm: Date;
};

export type BestCardSuggestion = {
  cardId: string;
  closingDate: Date;
  daysUntilClosing: number;
};

/**
 * FR-012/FR-025: cartão cujo fechamento de uma compra feita hoje cai mais
 * longe no futuro — melhor dia de compra é sempre fechamento + 1, então o
 * cartão que fechou mais recentemente (maior `daysUntilClosing`) é o
 * melhor. Ranqueia pela data de FECHAMENTO, não de vencimento: dois
 * cartões com carências (fechamento→vencimento) diferentes não devem
 * mudar esse ranking — só importa a proximidade ao próprio fechamento de
 * cada cartão. Cartões arquivados nunca entram no ranking. Empate exato
 * resolvido pelo cadastro mais antigo (`criadoEm`), para ser
 * determinístico (contracts/best-card.md).
 */
export function suggestBestCard(
  cards: BestCardCandidate[],
  today: Date,
): BestCardSuggestion | null {
  const active = cards.filter((card) => card.arquivadoEm === null);
  if (active.length === 0) return null;

  const withClosingDate = active.map((card) => {
    const { year, month } = resolveInvoicePeriod(card.diaFechamento, today);
    const { dataFechamento } = computeInvoiceDates(card, year, month);
    return { card, closingDate: dataFechamento };
  });

  const best = withClosingDate.reduce((best, current) => {
    if (current.closingDate.getTime() > best.closingDate.getTime()) return current;
    if (current.closingDate.getTime() < best.closingDate.getTime()) return best;
    return current.card.criadoEm.getTime() < best.card.criadoEm.getTime() ? current : best;
  });

  const millisecondsUntilClosing = best.closingDate.getTime() - today.getTime();
  const daysUntilClosing = Math.ceil(millisecondsUntilClosing / (24 * 60 * 60 * 1000));

  return { cardId: best.card.id, closingDate: best.closingDate, daysUntilClosing };
}
