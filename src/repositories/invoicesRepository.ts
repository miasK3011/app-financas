import { startOfDay } from 'date-fns';
import { and, eq, gte, inArray, isNull, lt, notInArray } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';

import { db } from '@/db/client';
import { cartoes, faturas, parcelas } from '@/db/schema';
import { computeInvoiceDates } from '@/domain/invoices/computeInvoiceDates';
import { computeInvoiceStatus, type InvoiceStatus } from '@/domain/invoices/computeInvoiceStatus';
import { computeInvoiceTotals } from '@/domain/invoices/computeInvoiceTotals';
import { demoteFutureOpenInvoices } from '@/domain/invoices/demoteFutureOpenInvoices';

export type Invoice = typeof faturas.$inferSelect;

/**
 * Qualquer coisa que execute queries síncronas do Drizzle — o próprio
 * `db` ou o `tx` de um `db.transaction((tx) => …)`. Permite que
 * criar/reconstruir/excluir parcelas (issue #17) rode numa única
 * transação, no mesmo padrão de `backupRepository.restoreAll`.
 */
export type DbExecutor = Pick<
  typeof db,
  'select' | 'selectDistinct' | 'insert' | 'update' | 'delete'
>;

export type InvoiceCard = { id: string; diaFechamento: number; diaVencimento: number };

/**
 * Upsert idempotente por `(cardId, year, month)` — cria a Fatura (com
 * `dataFechamento`/`dataVencimento` calculadas via `computeInvoiceDates`)
 * se ainda não existir, ou retorna a existente. Ver
 * `contracts/invoices.md` para a divisão puro/repositório.
 *
 * Issue #18: uma Fatura criada agora cujo vencimento JÁ PASSOU (parcelas
 * antigas de uma compra cadastrada depois) nasce PAGA, com `pagaEm` no
 * próprio vencimento — não faz sentido uma fatura "em aberto" no
 * passado. O usuário pode desmarcar o pagamento se não for o caso.
 */
export function ensureInvoice(
  executor: DbExecutor,
  card: InvoiceCard,
  year: number,
  month: number,
  today: Date = new Date(),
): Invoice {
  const existing = executor
    .select()
    .from(faturas)
    .where(
      and(
        eq(faturas.cartaoId, card.id),
        eq(faturas.referenciaAno, year),
        eq(faturas.referenciaMes, month),
      ),
    )
    .get();
  if (existing) {
    return existing;
  }

  const { dataFechamento, dataVencimento } = computeInvoiceDates(card, year, month);
  const alreadyDue = dataVencimento < startOfDay(today);

  return executor
    .insert(faturas)
    .values({
      id: randomUUID(),
      cartaoId: card.id,
      referenciaAno: year,
      referenciaMes: month,
      dataFechamento,
      dataVencimento,
      status: alreadyDue ? 'PAGA' : 'ABERTA',
      pagaEm: alreadyDue ? dataVencimento : null,
    })
    .returning()
    .get();
}

/** `ensureInvoice` fora de transação, buscando o cartão pelo id. */
export async function getOrCreateInvoice(
  cardId: string,
  year: number,
  month: number,
  today: Date = new Date(),
): Promise<Invoice> {
  const [card] = await db.select().from(cartoes).where(eq(cartoes.id, cardId));
  if (!card) {
    throw new Error(`Cartão ${cardId} não encontrado`);
  }
  return ensureInvoice(db, card, year, month, today);
}

export async function listInvoicesForCard(cardId: string): Promise<Invoice[]> {
  return db.select().from(faturas).where(eq(faturas.cartaoId, cardId));
}

export async function listInvoicesForCardWithTotals(
  cardId: string,
  today: Date = new Date(),
): Promise<InvoiceWithTotals[]> {
  const rows = await listInvoicesForCard(cardId);
  const rules = await loadClosingRules([cardId]);
  const withStatus = await Promise.all(rows.map((invoice) => withTotals(invoice, today, rules)));
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

/** Issue #19: desfaz um "Marcar como paga" feito por engano. */
export async function unmarkInvoiceAsPaid(invoiceId: string): Promise<void> {
  await db.update(faturas).set({ status: 'ABERTA', pagaEm: null }).where(eq(faturas.id, invoiceId));
}

/**
 * Remove as Faturas não pagas de um cartão que ficaram sem nenhuma
 * Parcela — depois de editar/excluir uma compra (issue #17) ou de mudar
 * as datas do cartão, para não sobrar uma fatura "Prevista R$ 0,00".
 * Faturas PAGAS ficam sempre (histórico).
 */
export function deleteEmptyUnpaidInvoices(executor: DbExecutor, cardId: string): void {
  const usedIds = executor
    .selectDistinct({ faturaId: parcelas.faturaId })
    .from(parcelas)
    .innerJoin(faturas, eq(parcelas.faturaId, faturas.id))
    .where(eq(faturas.cartaoId, cardId))
    .all()
    .map((row) => row.faturaId)
    .filter((id): id is string => id !== null);

  executor
    .delete(faturas)
    .where(
      and(
        eq(faturas.cartaoId, cardId),
        isNull(faturas.pagaEm),
        usedIds.length > 0 ? notInArray(faturas.id, usedIds) : undefined,
      ),
    )
    .run();
}

export type InvoiceWithTotals = Omit<Invoice, 'status'> & {
  status: InvoiceStatus;
  total: number;
  totalResponsabilidade: number;
};

/** Regra de fechamento (issue #16) de cada cartão, para `computeInvoiceStatus`. */
type ClosingRules = Map<string, boolean>;

async function loadClosingRules(cardIds?: string[]): Promise<ClosingRules> {
  const rows = await db
    .select({ id: cartoes.id, regra: cartoes.compraNoFechamentoVaiParaProxima })
    .from(cartoes)
    .where(cardIds ? inArray(cartoes.id, cardIds) : undefined);
  return new Map(rows.map((row) => [row.id, row.regra]));
}

async function withTotals(
  invoice: Invoice,
  today: Date,
  rules: ClosingRules,
): Promise<InvoiceWithTotals> {
  const invoiceParcelas = await db.select().from(parcelas).where(eq(parcelas.faturaId, invoice.id));
  const { total, totalResponsabilidade } = computeInvoiceTotals(invoiceParcelas);
  const status = computeInvoiceStatus(invoice, today, rules.get(invoice.cartaoId));
  return { ...invoice, status, total, totalResponsabilidade };
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
  const rules = await loadClosingRules();
  const withStatus = await Promise.all(
    allInvoices.map((invoice) => withTotals(invoice, today, rules)),
  );
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
  const rules = await loadClosingRules();
  return Promise.all(rows.map((invoice) => withTotals(invoice, today, rules)));
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
