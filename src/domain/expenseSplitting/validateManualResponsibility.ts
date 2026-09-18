export class InvalidResponsibilityError extends Error {}

/** FR-048: `0 ≤ valorResponsabilidade ≤ valorTotalOriginal`. */
export function validateManualResponsibility(
  valorResponsabilidade: number,
  valorTotalOriginal: number,
): void {
  if (valorResponsabilidade < 0 || valorResponsabilidade > valorTotalOriginal) {
    throw new InvalidResponsibilityError(
      'O valor de responsabilidade deve estar entre 0 e o valor total da compra',
    );
  }
}
