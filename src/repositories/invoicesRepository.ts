import { and, eq, gte, lt } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';

import { db } from '@/db/client';
import { cartoes, faturas, parcelas } from '@/db/schema';
import { computeInvoiceDates } from '@/domain/invoices/computeInvoiceDates';
import { computeInvoiceStatus, type InvoiceStatus } from '@/domain/invoices/computeInvoiceStatus';
import { computeInvoiceTotals } from '@/domain/invoices/computeInvoiceTotals';
import { demoteFutureOpenInvoices } from '@/domain/invoices/demoteFutureOpenInvoices';

export type Invoice = typeof faturas.$inferSelect;

/**
 * Upsert idempotente por `(cardId, year, month)` — cria a Fatura (com
 * `dataFechamento`/`dataVencimento` calculadas via `computeInvoiceDates`)
 * se ainda não existir, ou retorna a existente. Ver
 * `contracts/invoices.md` para a divisão puro/repositório.
 */
export async function getOrCreateInvoice(
  cardId: string,
  year: number,
  month: number,
): Promise<Invoice> {
  const [existing] = await db
    .select()
    .from(faturas)
    .where(
      and(
        eq(faturas.cartaoId, cardId),
        eq(faturas.referenciaAno, year),
        eq(faturas.referenciaMes, month),
      ),
    );
  if (existing) {
    return existing;
  }

  const [card] = await db.select().from(cartoes).where(eq(cartoes.id, cardId));
  if (!card) {
    throw new Error(`Cartão ${cardId} não encontrado`);
  }

  const { dataFechamento, dataVencimento } = computeInvoiceDates(card, year, month);

  const [invoice] = await db
    .insert(faturas)
    .values({
      id: randomUUID(),
      cartaoId: cardId,
      referenciaAno: year,
      referenciaMes: month,
      dataFechamento,
      dataVencimento,
      status: 'ABERTA',
      pagaEm: null,
    })
    .returning();

  return invoice;
}

export async function listInvoicesForCard(cardId: string): Promise<Invoice[]> {
  return db.select().from(faturas).where(eq(faturas.cartaoId, cardId));
}

export async function listInvoicesForCardWithTotals(
  cardId: string,
  today: Date = new Date(),
): Promise<InvoiceWithTotals[]> {
  const rows = await listInvoicesForCard(cardId);
  const withStatus = await Promise.all(rows.map((invoice) => withTotals(invoice, today)));
  return demoteFutureOpenInvoices(withStatus);
}

export async function getInvoice(invoiceId: string): Promise<Invoice | undefined> {
  const [invoice] = await db.select().from(faturas).where(eq(faturas.id, invoiceId));
  return invoice;
}

/**
 * Fatura + status derivado (já com `demoteFutureOpenInvoices` — ver
 * `listInvoicesForCardWithTotals`) + totais agregados das suas
 * Parcelas (FR-011, FR-053) — nunca uma coluna própria, sempre somado
 * na hora.
 */
export async function getInvoiceWithTotals(
  invoiceId: string,
  today: Date = new Date(),
): Promise<InvoiceWithTotals | undefined> {
  const invoice = await getInvoice(invoiceId);
  if (!invoice) return undefined;
  const cardInvoices = await listInvoicesForCardWithTotals(invoice.cartaoId, today);
  return cardInvoices.find((item) => item.id === invoiceId);
}

export async function markInvoiceAsPaid(invoiceId: string): Promise<void> {
  await db
    .update(faturas)
    .set({ status: 'PAGA', pagaEm: new Date() })
    .where(eq(faturas.id, invoiceId));
}

export type InvoiceWithTotals = Omit<Invoice, 'status'> & {
  status: InvoiceStatus;
  total: number;
  totalResponsabilidade: number;
};

async function withTotals(invoice: Invoice, today: Date): Promise<InvoiceWithTotals> {
  const invoiceParcelas = await db.select().from(parcelas).where(eq(parcelas.faturaId, invoice.id));
  const { total, totalResponsabilidade } = computeInvoiceTotals(invoiceParcelas);
  return { ...invoice, status: computeInvoiceStatus(invoice, today), total, totalResponsabilidade };
}

/**
 * Faturas com status `ABERTA` (ainda dentro do ciclo, antes do
 * fechamento) de todos os cartões — base do card "Total das faturas
 * abertas" em Cartões · Main. Exclui `FECHADA` (já fechou, aguardando
 * pagamento — não é mais "aberta"), `PAGA` e `FUTURA` (faturas de
 * parcelas ainda não iniciadas, ver `demoteFutureOpenInvoices`).
 */
export async function listOpenInvoicesWithTotals(
  today: Date = new Date(),
): Promise<InvoiceWithTotals[]> {
  const allInvoices = await db.select().from(faturas);
  const withStatus = await Promise.all(allInvoices.map((invoice) => withTotals(invoice, today)));
  const demoted = demoteFutureOpenInvoices(withStatus);
  return demoted.filter((invoice) => invoice.status === 'ABERTA');
}

/**
 * Faturas de qualquer cartão cujo VENCIMENTO cai no (ano, mês) pedido —
 * base do saldo do mês (FR-015), independente de quando fecharam.
 */
export async function listInvoicesDueInMonth(
  year: number,
  month: number,
  today: Date = new Date(),
): Promise<InvoiceWithTotals[]> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);
  const rows = await db
    .select()
    .from(faturas)
    .where(and(gte(faturas.dataVencimento, monthStart), lt(faturas.dataVencimento, monthEnd)));
  return Promise.all(rows.map((invoice) => withTotals(invoice, today)));
}

/**
 * `MonthRange.latest` (`contracts/purchases-overview.md`): data de
 * vencimento de toda Fatura que tenha ao menos uma Parcela associada
 * — o que define até que mês futuro a tela Compras pode navegar
 * (FR-009).
 */
export async function listInvoiceDueDatesWithParcela(): Promise<Date[]> {
  const rows = await db
    .selectDistinct({ dataVencimento: faturas.dataVencimento })
    .from(faturas)
    .innerJoin(parcelas, eq(parcelas.faturaId, faturas.id));
  return rows.map((row) => row.dataVencimento);
}
