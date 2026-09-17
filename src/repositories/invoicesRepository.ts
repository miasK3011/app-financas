import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';

import { db } from '@/db/client';
import { cartoes, faturas, parcelas } from '@/db/schema';
import { computeInvoiceDates } from '@/domain/invoices/computeInvoiceDates';
import { computeInvoiceStatus, type InvoiceStatus } from '@/domain/invoices/computeInvoiceStatus';
import { computeInvoiceTotals } from '@/domain/invoices/computeInvoiceTotals';

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
  return Promise.all(rows.map((invoice) => withTotals(invoice, today)));
}

export async function getInvoice(invoiceId: string): Promise<Invoice | undefined> {
  const [invoice] = await db.select().from(faturas).where(eq(faturas.id, invoiceId));
  return invoice;
}

/**
 * Fatura + status derivado + totais agregados das suas Parcelas
 * (FR-011, FR-053) — nunca uma coluna própria, sempre somado na hora.
 */
export async function getInvoiceWithTotals(
  invoiceId: string,
  today: Date = new Date(),
): Promise<InvoiceWithTotals | undefined> {
  const invoice = await getInvoice(invoiceId);
  return invoice ? withTotals(invoice, today) : undefined;
}

export async function markInvoiceAsPaid(invoiceId: string): Promise<void> {
  await db.update(faturas).set({ status: 'PAGA', pagaEm: new Date() }).where(eq(faturas.id, invoiceId));
}

export type InvoiceWithTotals = Invoice & {
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
 * Todas as faturas ainda não pagas (`ABERTA` ou `FECHADA` na exibição),
 * de todos os cartões — base do card "Total das faturas abertas" em
 * Cartões · Main.
 */
export async function listOpenInvoicesWithTotals(today: Date = new Date()): Promise<InvoiceWithTotals[]> {
  const allInvoices = await db.select().from(faturas);
  const withStatus = await Promise.all(allInvoices.map((invoice) => withTotals(invoice, today)));
  return withStatus.filter((invoice) => invoice.status !== 'PAGA');
}
