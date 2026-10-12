import type { InvoiceStatus } from './computeInvoiceStatus';

/**
 * Lista de faturas de um cartão vista um ano por vez, com as pagas
 * ocultas por padrão (FR-011/FR-012 da feature 003, issue #23). O ano de
 * uma fatura é o do seu rótulo ("Novembro 2026" → 2026), o mesmo que a
 * linha exibe — inclusive para faturas FUTURA (previstas).
 */
type YearViewInvoice = {
  referenciaAno: number;
  referenciaMes: number;
  status: InvoiceStatus;
};

/** Anos distintos com ao menos uma fatura, do mais antigo para o mais recente. */
export function availableYears(invoices: YearViewInvoice[]): number[] {
  return Array.from(new Set(invoices.map((invoice) => invoice.referenciaAno))).sort(
    (a, b) => a - b,
  );
}

/** Ano corrente se houver fatura nele; senão o ano com faturas mais próximo (empate: o mais recente). */
export function initialYear(years: number[], today: Date): number | undefined {
  const current = today.getFullYear();
  if (years.length === 0) return undefined;
  if (years.includes(current)) return current;
  return [...years].sort((a, b) => Math.abs(a - current) - Math.abs(b - current) || b - a)[0];
}

/**
 * Ordem da lista: ABERTA/FECHADA/PAGA da mais recente para a mais
 * antiga, depois as FUTURA da mais próxima para a mais distante.
 */
export function sortInvoicesForList<T extends YearViewInvoice>(invoices: T[]): T[] {
  return [...invoices].sort((a, b) => {
    const aFutura = a.status === 'FUTURA';
    const bFutura = b.status === 'FUTURA';
    if (aFutura !== bFutura) return aFutura ? 1 : -1;

    const order = b.referenciaAno - a.referenciaAno || b.referenciaMes - a.referenciaMes;
    return aFutura ? -order : order;
  });
}

/** Faturas do ano, já ordenadas; as PAGA só entram com `showPaid`. */
export function filterInvoicesForYear<T extends YearViewInvoice>(
  invoices: T[],
  year: number,
  showPaid: boolean,
): T[] {
  return sortInvoicesForList(
    invoices.filter(
      (invoice) => invoice.referenciaAno === year && (showPaid || invoice.status !== 'PAGA'),
    ),
  );
}

export function countPaidInYear(invoices: YearViewInvoice[], year: number): number {
  return invoices.filter((invoice) => invoice.referenciaAno === year && invoice.status === 'PAGA')
    .length;
}
