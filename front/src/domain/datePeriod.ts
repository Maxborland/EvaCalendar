import { addDays, formatDateToYYYYMMDD, startOfISOWeek } from '../utils/dateUtils';

export type DatePeriodKind = 'week' | 'month';

export interface DatePeriodRange {
  start: string;
  end: string;
  label: string;
}

export const getTodayUTC = (now = new Date()) =>
  new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

export const getTodayDateString = (now = new Date()) => formatDateToYYYYMMDD(getTodayUTC(now));

export const getDateOffsetString = (daysOffset: number, now = new Date()) => {
  const date = getTodayUTC(now);
  date.setUTCDate(date.getUTCDate() + daysOffset);
  return formatDateToYYYYMMDD(date);
};

export const getCurrentPeriodRange = (period: DatePeriodKind, now = new Date()): DatePeriodRange => {
  const today = getTodayUTC(now);
  if (period === 'week') {
    const weekStart = startOfISOWeek(today);
    const weekEnd = addDays(weekStart, 6);
    return {
      start: formatDateToYYYYMMDD(weekStart),
      end: formatDateToYYYYMMDD(weekEnd),
      label: 'Эта неделя',
    };
  }

  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  return {
    start: formatDateToYYYYMMDD(new Date(Date.UTC(year, month, 1))),
    end: formatDateToYYYYMMDD(new Date(Date.UTC(year, month + 1, 0))),
    label: 'Этот месяц',
  };
};
