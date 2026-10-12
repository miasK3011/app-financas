export type MonthBalanceInput = {
  /** Renda vigente no mês (centavos), ou `null` se nenhuma configurada. */
  rendaVigente: number | null;
  /** Valores (centavos) das EntradaAvulsa do mês que contam no saldo (ver `balanceEntries`). */
  entradasAvulsas: number[];
  /** Parte do usuário (centavos) em cada Compra Pix feita no mês (FR-001 da feature 003). */
  comprasPix: number[];
  /** Parte do usuário (centavos) em cada Fatura que vence no mês (FR-001 da feature 003). */
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
