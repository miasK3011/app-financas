export type SubscriptionAmountLike = {
  valor: number;
  canceladaEm: Date | null;
};

/**
 * `contracts/subscriptions.md` § `monthlySubscriptionsTotal` — soma o
 * `valor` de toda Assinatura ativa (FR-018); usada também por
 * `domain/statistics` para o percentual comprometido com assinaturas
 * (FR-045).
 */
export function monthlySubscriptionsTotal(subscriptions: SubscriptionAmountLike[]): number {
  return subscriptions
    .filter((subscription) => subscription.canceladaEm === null)
    .reduce((sum, subscription) => sum + subscription.valor, 0);
}
