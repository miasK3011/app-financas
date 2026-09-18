export type UnassignedTransaction = {
  compraId: string;
  descricao: string;
  estabelecimentoManual: boolean;
};

/**
 * FR-035: chamado quando um Padrão de Reconhecimento é criado — quais
 * `compraId` devem ganhar o novo Estabelecimento. Nunca sobrescreve
 * uma associação manual (`estabelecimentoManual === true`, FR-034,
 * Edge Case).
 */
export function reevaluateUnassignedTransactions(
  newPattern: { texto: string },
  unassignedTransactions: UnassignedTransaction[],
): string[] {
  const lowerTexto = newPattern.texto.toLowerCase();
  return unassignedTransactions
    .filter(
      (transaction) =>
        !transaction.estabelecimentoManual &&
        transaction.descricao.toLowerCase().includes(lowerTexto),
    )
    .map((transaction) => transaction.compraId);
}
