import { clampDayToMonth } from '@/domain/shared/dateClamp';

describe('clampDayToMonth', () => {
  it('keeps the day as-is when the month has enough days', () => {
    const date = clampDayToMonth(10, 2026, 10);
    expect(date.getDate()).toBe(10);
    expect(date.getMonth()).toBe(9); // October, 0-indexed
  });

  it('clamps day 31 to day 30 in a 30-day month (April)', () => {
    const date = clampDayToMonth(31, 2026, 4);
    expect(date.getDate()).toBe(30);
  });

  it('clamps day 31 to day 28 in February on a non-leap year', () => {
    const date = clampDayToMonth(31, 2026, 2);
    expect(date.getDate()).toBe(28);
  });

  it('clamps day 30 to day 29 in February on a leap year', () => {
    const date = clampDayToMonth(30, 2028, 2);
    expect(date.getDate()).toBe(29);
  });
});
