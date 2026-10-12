import { format, isSameDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { DayGroup } from './types';

/**
 * FR-010 (002) / FR-007 e FR-013 (003): agrupa por dia calendário de
 * `getDate(row)` — "Hoje" / "Ontem" / "{d} de {mês por extenso}". Ordena
 * uma cópia do mais recente para o mais antigo antes de agrupar (a
 * ordenação é estável: linhas do mesmo instante mantêm a ordem de
 * entrada); a entrada nunca é mutada. Genérico para servir tanto à tela
 * Compras quanto ao detalhe da fatura.
 */
export function groupByDay<T>(rows: T[], getDate: (row: T) => Date, today: Date): DayGroup<T>[] {
  const sorted = [...rows].sort((a, b) => getDate(b).getTime() - getDate(a).getTime());
  const groups: DayGroup<T>[] = [];

  for (const row of sorted) {
    const date = getDate(row);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && isSameDay(lastGroup.date, date)) {
      lastGroup.rows.push(row);
      continue;
    }
    groups.push({ label: labelForDay(date, today), date, rows: [row] });
  }

  return groups;
}

/**
 * "Hoje"/"Ontem" comparados contra o `today` recebido, nunca contra o
 * relógio do sistema diretamente — mantém a função pura e testável com
 * uma data fixa (`isToday`/`isYesterday` do date-fns ignorariam o
 * parâmetro e comparariam sempre com `new Date()` real).
 */
function labelForDay(date: Date, today: Date): string {
  if (isSameDay(date, today)) return 'Hoje';
  if (isSameDay(date, subDays(today, 1))) return 'Ontem';
  return format(date, "d 'de' MMMM", { locale: ptBR });
}
