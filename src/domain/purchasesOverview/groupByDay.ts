import { format, isSameDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { DayGroup, PurchaseListRow } from './types';

/**
 * FR-010: agrupa por dia calendário de `row.dataCompra` — "Hoje" /
 * "Ontem" / "{d} de {mês por extenso}". Linhas já devem vir ordenadas
 * (mais recente primeiro) do repositório; aqui só agrupamos mantendo
 * essa ordem, sem reordenar.
 */
export function groupByDay(rows: PurchaseListRow[], today: Date): DayGroup[] {
  const groups: DayGroup[] = [];

  for (const row of rows) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && isSameDay(lastGroup.rows[0].dataCompra, row.dataCompra)) {
      lastGroup.rows.push(row);
      continue;
    }
    groups.push({ label: labelForDay(row.dataCompra, today), rows: [row] });
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
