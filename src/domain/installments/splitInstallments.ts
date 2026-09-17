export class InvalidInstallmentError extends Error {}

export type InstallmentPlan = {
  numero: number;
  valor: number;
  valorResponsabilidade: number;
};

export type SplitInstallmentsInput = {
  valorTotalOriginal: number;
  parcelasTotal: number;
  parcelaAtual: number;
  valorResponsabilidade: number | null;
};

/**
 * FR-004..FR-006, FR-055. Gera uma entrada para cada parcela de
 * `parcelaAtual` até `parcelasTotal` (nunca números menores —
 * parcelamento já em andamento, FR-006); a diferença de arredondamento
 * da divisão inteira é absorvida pela primeira parcela gerada
 * (Assumption). `valorResponsabilidade` de cada parcela aplica a mesma
 * proporção responsabilidade/total em todas (FR-055).
 */
export function splitInstallments(input: SplitInstallmentsInput): InstallmentPlan[] {
  const { valorTotalOriginal, parcelasTotal, parcelaAtual, valorResponsabilidade } = input;

  if (parcelaAtual < 1 || parcelaAtual > parcelasTotal) {
    throw new InvalidInstallmentError(
      'A parcela atual não pode ser maior que o total de parcelas, nem menor que 1',
    );
  }

  const valorBase = Math.floor(valorTotalOriginal / parcelasTotal);
  const diferencaArredondamento = valorTotalOriginal - valorBase * parcelasTotal;
  const responsabilidadeEfetiva = valorResponsabilidade ?? valorTotalOriginal;

  const plan: InstallmentPlan[] = [];
  for (let numero = parcelaAtual; numero <= parcelasTotal; numero++) {
    const valor = numero === parcelaAtual ? valorBase + diferencaArredondamento : valorBase;
    const valorParcelaResponsabilidade = Math.round(
      (valor * responsabilidadeEfetiva) / valorTotalOriginal,
    );
    plan.push({ numero, valor, valorResponsabilidade: valorParcelaResponsabilidade });
  }
  return plan;
}
