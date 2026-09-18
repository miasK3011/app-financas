import { clampDayToMonth } from '@/domain/shared/dateClamp';

export type SubscriptionLike = {
  id: string;
  diaCobranca: number;
  dataInicio: Date;
  canceladaEm: Date | null;
};

export type ExistingGeneratedCharge = {
  assinaturaId: string;
  year: number;
  month: number;
};

export type PendingCharge = {
  assinaturaId: string;
  year: number;
  month: number;
  chargeDate: Date;
};

/**
 * `contracts/subscriptions.md` § `pendingChargesFor` — puramente
 * funcional, não escreve nada. Para cada Assinatura ativa cujo
 * `dataInicio` já chegou: calcula o dia de cobrança do mês corrente
 * (clamp de mês curto — mesma regra de Cartão) e, se hoje já alcançou
 * essa data **e** ainda não existe geração para
 * `(assinaturaId, year, month)`, inclui no retorno (FR-017).
 */
export function pendingChargesFor(
  subscriptions: SubscriptionLike[],
  existingGenerated: ExistingGeneratedCharge[],
  today: Date,
): PendingCharge[] {
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const alreadyGenerated = new Set(
    existingGenerated.map((item) => `${item.assinaturaId}:${item.year}:${item.month}`),
  );

  const pending: PendingCharge[] = [];
  for (const subscription of subscriptions) {
    if (subscription.canceladaEm !== null) continue;
    if (subscription.dataInicio > today) continue;

    const chargeDate = clampDayToMonth(subscription.diaCobranca, year, month);
    if (today < chargeDate) continue;

    const key = `${subscription.id}:${year}:${month}`;
    if (alreadyGenerated.has(key)) continue;

    pending.push({ assinaturaId: subscription.id, year, month, chargeDate });
  }

  return pending;
}
