import { describe, expect, it } from 'vitest';
import { getCurrentPeriodRange, getDateOffsetString, getTodayDateString, getTodayUTC } from './datePeriod';

describe('datePeriod contract', () => {
  const monday = new Date('2026-06-01T13:30:00.000Z');

  it('normalizes today and offsets to date-only UTC strings', () => {
    expect(getTodayUTC(monday).toISOString()).toBe('2026-06-01T00:00:00.000Z');
    expect(getTodayDateString(monday)).toBe('2026-06-01');
    expect(getDateOffsetString(1, monday)).toBe('2026-06-02');
  });

  it('returns current week and month ranges for finance screens', () => {
    expect(getCurrentPeriodRange('week', monday)).toEqual({
      start: '2026-06-01',
      end: '2026-06-07',
      label: 'Эта неделя',
    });
    expect(getCurrentPeriodRange('month', monday)).toEqual({
      start: '2026-06-01',
      end: '2026-06-30',
      label: 'Этот месяц',
    });
  });
});
