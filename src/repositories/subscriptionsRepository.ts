import { and, eq, isNull } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import { z } from 'zod';

import { db } from '@/db/client';
import { assinaturaTags, assinaturas, compras, tags } from '@/db/schema';
import { monthlySubscriptionsTotal } from '@/domain/subscriptions/monthlySubscriptionsTotal';
import { pendingChargesFor } from '@/domain/subscriptions/pendingChargesFor';

import { createCardPurchase, createPixPurchase } from './purchasesRepository';
import { findOrCreateTag } from './tagsRepository';

export type Subscription = typeof assinaturas.$inferSelect;

export const subscriptionInputSchema = z
  .object({
    nome: z.string().min(1),
    valor: z.number().int().positive(),
    formaPagamento: z.enum(['PIX', 'CARTAO']),
    cartaoId: z.string().optional(),
    diaCobranca: z.number().int().min(1).max(31),
    categoriaId: z.string().optional(),
    tagNomes: z.array(z.string()).optional(),
  })
  .refine((data) => data.formaPagamento !== 'CARTAO' || Boolean(data.cartaoId), {
    message: 'Assinaturas no cartão exigem um cartão selecionado',
    path: ['cartaoId'],
  });

export type SubscriptionInput = z.infer<typeof subscriptionInputSchema>;

/**
 * FR-016/FR-007: resolve (criando se preciso) cada nome de tag e grava
 * o vínculo `AssinaturaTag` — o "template" copiado para cada Compra
 * gerada no momento da geração (data-model.md § Assinatura).
 */
async function attachTagsToSubscription(
  assinaturaId: string,
  tagNomes: string[] | undefined,
): Promise<void> {
  if (!tagNomes || tagNomes.length === 0) return;
  const tagRows = await Promise.all(tagNomes.map((nome) => findOrCreateTag(nome)));
  await db.insert(assinaturaTags).values(tagRows.map((tag) => ({ assinaturaId, tagId: tag.id })));
}

/** FR-016: `dataInicio` é sempre o momento do cadastro — nenhuma tela pede essa data ao usuário. */
export async function createSubscription(input: SubscriptionInput): Promise<Subscription> {
  const parsed = subscriptionInputSchema.parse(input);

  const [subscription] = await db
    .insert(assinaturas)
    .values({
      id: randomUUID(),
      nome: parsed.nome,
      valor: parsed.valor,
      formaPagamento: parsed.formaPagamento,
      cartaoId: parsed.formaPagamento === 'CARTAO' ? parsed.cartaoId : null,
      diaCobranca: parsed.diaCobranca,
      dataInicio: new Date(),
      canceladaEm: null,
      categoriaId: parsed.categoriaId,
    })
    .returning();

  await attachTagsToSubscription(subscription.id, parsed.tagNomes);
  return subscription;
}

export type UpdateSubscriptionInput = {
  nome?: string;
  valor?: number;
  formaPagamento?: 'PIX' | 'CARTAO';
  cartaoId?: string | null;
  diaCobranca?: number;
  categoriaId?: string | null;
};

/**
 * Edge Case (FR-017): muda só a configuração vigente da Assinatura —
 * nunca reescreve Compras já geradas, pois cada uma guarda sua própria
 * cópia de forma de pagamento/cartão/categoria/tags de quando foi
 * criada. Só afeta as próximas gerações de `generatePendingCharges`.
 */
export async function updateSubscription(
  id: string,
  updates: UpdateSubscriptionInput,
): Promise<void> {
  await db.update(assinaturas).set(updates).where(eq(assinaturas.id, id));
}

export async function setSubscriptionTags(assinaturaId: string, tagNomes: string[]): Promise<void> {
  await db.delete(assinaturaTags).where(eq(assinaturaTags.assinaturaId, assinaturaId));
  await attachTagsToSubscription(assinaturaId, tagNomes);
}

export async function listTagsForSubscription(assinaturaId: string): Promise<string[]> {
  const rows = await db
    .select({ nome: tags.nome })
    .from(assinaturaTags)
    .innerJoin(tags, eq(assinaturaTags.tagId, tags.id))
    .where(eq(assinaturaTags.assinaturaId, assinaturaId));
  return rows.map((row) => row.nome);
}

export async function listActiveSubscriptions(): Promise<Subscription[]> {
  return db.select().from(assinaturas).where(isNull(assinaturas.canceladaEm));
}

export async function listAllSubscriptions(): Promise<Subscription[]> {
  return db.select().from(assinaturas);
}

export async function getSubscription(id: string): Promise<Subscription | undefined> {
  const [subscription] = await db.select().from(assinaturas).where(eq(assinaturas.id, id));
  return subscription;
}

export async function cancelSubscription(id: string): Promise<void> {
  await db
    .update(assinaturas)
    .set({ canceladaEm: new Date() })
    .where(and(eq(assinaturas.id, id), isNull(assinaturas.canceladaEm)));
}

/** FR-018 */
export async function getMonthlySubscriptionsTotal(): Promise<number> {
  return monthlySubscriptionsTotal(await listActiveSubscriptions());
}

/**
 * FR-017: gera, de forma idempotente, as Compras (`origem = 'ASSINATURA'`)
 * pendentes do mês corrente — chamada a cada abertura do app
 * (`app/_layout.tsx`) e ao entrar em Início/Assinaturas. Reaproveita
 * `createCardPurchase`/`createPixPurchase` (mesmo caminho de qualquer
 * outra compra), copiando forma de pagamento/cartão/categoria/tags
 * VIGENTES da Assinatura neste momento — nunca as de uma geração
 * anterior.
 */
export async function generatePendingCharges(today: Date = new Date()): Promise<void> {
  const active = await listActiveSubscriptions();
  if (active.length === 0) return;

  const generatedRows = await db
    .select({ assinaturaId: compras.assinaturaId, dataCompra: compras.dataCompra })
    .from(compras)
    .where(eq(compras.origem, 'ASSINATURA'));

  const existingGenerated = generatedRows
    .filter((row): row is { assinaturaId: string; dataCompra: Date } => row.assinaturaId !== null)
    .map((row) => ({
      assinaturaId: row.assinaturaId,
      year: row.dataCompra.getFullYear(),
      month: row.dataCompra.getMonth() + 1,
    }));

  const pending = pendingChargesFor(active, existingGenerated, today);

  for (const charge of pending) {
    const subscription = active.find((item) => item.id === charge.assinaturaId);
    if (!subscription) continue;

    const tagNomes = await listTagsForSubscription(subscription.id);

    if (subscription.formaPagamento === 'CARTAO') {
      await createCardPurchase({
        descricao: subscription.nome,
        valorTotalOriginal: subscription.valor,
        dataCompra: charge.chargeDate,
        cartaoId: subscription.cartaoId!,
        categoriaId: subscription.categoriaId ?? undefined,
        tagNomes,
        origem: 'ASSINATURA',
        assinaturaId: subscription.id,
      });
    } else {
      await createPixPurchase({
        descricao: subscription.nome,
        valorTotalOriginal: subscription.valor,
        dataCompra: charge.chargeDate,
        categoriaId: subscription.categoriaId ?? undefined,
        tagNomes,
        origem: 'ASSINATURA',
        assinaturaId: subscription.id,
      });
    }
  }
}
