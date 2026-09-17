import { lastDayOfMonth, setDate } from 'date-fns';

/**
 * Resolve um dia de fechamento/vencimento/cobrança (1-31) para uma data
 * real em um (ano, mês) específico, ajustando para o último dia válido
 * quando o mês é mais curto (ex.: dia 31 em abril vira 30; dia 31 em
 * fevereiro vira 28 ou 29 conforme o ano seja bissexto) — Edge Case da
 * spec: "dia de fechamento/vencimento/cobrança configurado além do
 * último dia de um mês mais curto".
 *
 * @param day 1-31
 * @param year ano completo (ex.: 2026)
 * @param month 1-12 (não 0-indexado, ao contrário do `Date` nativo)
 */
export function clampDayToMonth(day: number, year: number, month: number): Date {
  const firstOfMonth = new Date(year, month - 1, 1);
  const maxDay = lastDayOfMonth(firstOfMonth).getDate();
  return setDate(firstOfMonth, Math.min(day, maxDay));
}
