import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';

import type { Period, PeriodKind } from './types';

/**
 * FR-039: deriva o período corrente e o equivalente imediatamente
 * anterior a partir de uma data-âncora — semana sempre começa na
 * segunda-feira (convenção do app, não explicitada na spec).
 */
export function resolvePeriod(
  kind: PeriodKind,
  anchor: Date,
): { current: Period; previous: Period } {
  switch (kind) {
    case 'DIARIO': {
      const previousAnchor = addDays(anchor, -1);
      return {
        current: { start: startOfDay(anchor), end: endOfDay(anchor) },
        previous: { start: startOfDay(previousAnchor), end: endOfDay(previousAnchor) },
      };
    }
    case 'SEMANAL': {
      const previousAnchor = addWeeks(anchor, -1);
      return {
        current: {
          start: startOfWeek(anchor, { weekStartsOn: 1 }),
          end: endOfWeek(anchor, { weekStartsOn: 1 }),
        },
        previous: {
          start: startOfWeek(previousAnchor, { weekStartsOn: 1 }),
          end: endOfWeek(previousAnchor, { weekStartsOn: 1 }),
        },
      };
    }
    case 'ANUAL': {
      const previousAnchor = addYears(anchor, -1);
      return {
        current: { start: startOfYear(anchor), end: endOfYear(anchor) },
        previous: { start: startOfYear(previousAnchor), end: endOfYear(previousAnchor) },
      };
    }
    case 'MENSAL':
    default: {
      const previousAnchor = addMonths(anchor, -1);
      return {
        current: { start: startOfMonth(anchor), end: endOfMonth(anchor) },
        previous: { start: startOfMonth(previousAnchor), end: endOfMonth(previousAnchor) },
      };
    }
  }
}
