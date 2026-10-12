/**
 * FR-001a (feature 003): entradas avulsas que entram no saldo do mês.
 * Uma entrada vinculada a uma compra (reembolso) já reduziu a parte do
 * usuário naquela compra (`recomputeSplitOnRefund`) — somá-la de novo ao
 * saldo contaria o reembolso duas vezes.
 */
export function balanceEntries(
  entries: { valor: number; compraVinculadaId: string | null }[],
): number[] {
  return entries.filter((entry) => !entry.compraVinculadaId).map((entry) => entry.valor);
}
