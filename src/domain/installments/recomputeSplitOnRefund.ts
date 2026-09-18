/**
 * `data-model.md` § Responsabilidade efetiva — ramo "com entradas
 * vinculadas": `valorTotalOriginal - soma(entradasVinculadas.valor)`,
 * nunca abaixo de zero. Chamado sempre que uma EntradaAvulsa é criada,
 * editada ou desvinculada de uma Compra (FR-051).
 */
export function recomputeSplitOnRefund(
  compra: { valorTotalOriginal: number },
  entradasVinculadas: { valor: number }[],
): number {
  const totalEntradas = entradasVinculadas.reduce((sum, entrada) => sum + entrada.valor, 0);
  return Math.max(0, compra.valorTotalOriginal - totalEntradas);
}
