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
  dueDate: Date;
  daysUntilDue: number;
};

/**
 * FR-012/FR-025: cartão cuja fatura de uma compra feita hoje venceria
 * mais tarde — maior prazo total até o pagamento. Cartões arquivados
 * nunca entram no ranking. Empate exato resolvido pelo cadastro mais
 * antigo (`criadoEm`), para ser determinístico (contracts/best-card.md).
 */
export function suggestBestCard(
  cards: BestCardCandidate[],
  today: Date,
): BestCardSuggestion | null {
  const active = cards.filter((card) => card.arquivadoEm === null);
  if (active.length === 0) return null;

  const withDueDate = active.map((card) => {
    const { year, month } = resolveInvoicePeriod(card.diaFechamento, today);
    const { dataVencimento } = computeInvoiceDates(card, year, month);
    return { card, dueDate: dataVencimento };
  });

  const best = withDueDate.reduce((best, current) => {
    if (current.dueDate.getTime() > best.dueDate.getTime()) return current;
    if (current.dueDate.getTime() < best.dueDate.getTime()) return best;
    return current.card.criadoEm.getTime() < best.card.criadoEm.getTime() ? current : best;
  });

  const millisecondsUntilDue = best.dueDate.getTime() - today.getTime();
  const daysUntilDue = Math.ceil(millisecondsUntilDue / (24 * 60 * 60 * 1000));

  return { cardId: best.card.id, dueDate: best.dueDate, daysUntilDue };
}
