import { useQuery } from '@tanstack/react-query';
import {
  getDailyBreakdown,
  getCategoryBreakdown,
  getMonthlySummary,
} from '../services/api';

export const summaryKeys = {
  all: ['summary'] as const,
  dailyBreakdown: (start: string, end: string) =>
    [...summaryKeys.all, 'dailyBreakdown', start, end] as const,
  categoryBreakdown: (start: string, end: string) =>
    [...summaryKeys.all, 'categoryBreakdown', start, end] as const,
  monthly: (year: number, month: number) =>
    [...summaryKeys.all, 'monthly', year, month] as const,
};

export function useDailyBreakdown(start: string, end: string) {
  return useQuery({
    queryKey: summaryKeys.dailyBreakdown(start, end),
    queryFn: () => getDailyBreakdown(start, end),
    enabled: !!start && !!end,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCategoryBreakdown(start: string, end: string) {
  return useQuery({
    queryKey: summaryKeys.categoryBreakdown(start, end),
    queryFn: () => getCategoryBreakdown(start, end),
    enabled: !!start && !!end,
    staleTime: 1000 * 60 * 5,
  });
}

export function useMonthlySummary(year: number, month: number) {
  return useQuery({
    queryKey: summaryKeys.monthly(year, month),
    queryFn: () => getMonthlySummary(year, month),
    enabled: year > 0 && month > 0,
    staleTime: 1000 * 60 * 5,
  });
}
