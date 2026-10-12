import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { Period, PeriodKind } from './types';

/**
 * Rótulo curto do período para cabeçalhos (feature 003, detalhamento por
 * categoria): "12/10/2026", "6/10 – 12/10", "Outubro 2026", "2026".
 */
export function periodLabel(kind: PeriodKind, period: Period): string {
  switch (kind) {
    case 'DIARIO':
      return format(period.start, 'dd/MM/yyyy');
    case 'SEMANAL':
      return `${format(period.start, 'd/M')} – ${format(period.end, 'd/M')}`;
    case 'MENSAL': {
      const month = format(period.start, 'MMMM yyyy', { locale: ptBR });
      return month.charAt(0).toUpperCase() + month.slice(1);
    }
    case 'ANUAL':
      return format(period.start, 'yyyy');
  }
}
