export type MonthBalanceInput = {
  /** Renda vigente no mês (centavos), ou `null` se nenhuma configurada. */
  rendaVigente: number | null;
  /** Valores (centavos) de cada EntradaAvulsa do mês. */
  entradasAvulsas: number[];
  /** Valores (centavos) de cada Compra Pix feita no mês. */
  comprasPix: number[];
  /** Valores totais (centavos) de cada Fatura que vence no mês. */
  faturasVencendo: number[];
};

const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0);

/**
 * FR-015: saldo do mês = renda vigente + entradas avulsas do mês −
 * compras Pix do mês − faturas de cartão que vencem no mês. Renda
 * ausente conta como zero (a UI decide separadamente se mostra o
 * estado vazio — Edge Case "sem renda mensal configurada").
 */
export function computeMonthBalance(input: MonthBalanceInput): number {
  return (
    (input.rendaVigente ?? 0) +
    sum(input.entradasAvulsas) -
    sum(input.comprasPix) -
    sum(input.faturasVencendo)
  );
}
