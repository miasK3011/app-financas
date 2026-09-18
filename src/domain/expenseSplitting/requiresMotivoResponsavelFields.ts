/**
 * FR-047: controla se os campos "motivo"/"responsável" aparecem em
 * destaque no formulário — só quando a responsabilidade foi definida
 * manualmente e é diferente do total (nunca quando vem de entrada
 * vinculada, que já tem seu próprio registro/descrição).
 */
export function requiresMotivoResponsavelFields(
  valorResponsabilidade: number | null,
  valorTotalOriginal: number,
): boolean {
  return valorResponsabilidade !== null && valorResponsabilidade !== valorTotalOriginal;
}
