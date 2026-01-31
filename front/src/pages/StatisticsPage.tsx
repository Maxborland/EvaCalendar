import clsx from 'clsx';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import TopNavigator from '../components/TopNavigator';
import { useCategoryBreakdown, useDailyBreakdown, useMonthlySummary } from '../hooks/useSummary';
import {
  addDays,
  formatDateToYYYYMMDD,
  startOfISOWeek,
} from '../utils/dateUtils';

type PeriodType = 'week' | 'month' | 'custom';

const INCOME_COLOR = '#48bb78';
const EXPENSE_COLOR = '#e85d75';
const PIE_COLORS = [
  '#e85d75', '#f6ad55', '#ed8936', '#fc8181',
  '#f687b3', '#b794f4', '#76e4f7', '#68d391',
];

const formatCurrency = (value: number) =>
  value.toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatShortDate = (dateStr: string) => {
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  return `${parseInt(parts[2], 10)}.${parts[1]}`;
};

const getTodayUTC = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

const StatisticsPage = () => {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { start, end, year, month } = useMemo(() => {
    const today = getTodayUTC();
    if (period === 'week') {
      const weekStart = startOfISOWeek(today);
      const weekEnd = addDays(weekStart, 6);
      return {
        start: formatDateToYYYYMMDD(weekStart),
        end: formatDateToYYYYMMDD(weekEnd),
        year: today.getUTCFullYear(),
        month: today.getUTCMonth() + 1,
      };
    }
    if (period === 'custom' && customStart && customEnd) {
      return {
        start: customStart,
        end: customEnd,
        year: 0,
        month: 0,
      };
    }
    // month
    const y = today.getUTCFullYear();
    const m = today.getUTCMonth() + 1;
    const firstDay = new Date(Date.UTC(y, m - 1, 1));
    const lastDay = new Date(Date.UTC(y, m, 0));
    return {
      start: formatDateToYYYYMMDD(firstDay),
      end: formatDateToYYYYMMDD(lastDay),
      year: y,
      month: m,
    };
  }, [period, customStart, customEnd]);

  const {
    data: dailyData = [],
    isLoading: isDailyLoading,
  } = useDailyBreakdown(start, end);

  const {
    data: categoryData = [],
    isLoading: isCategoryLoading,
  } = useCategoryBreakdown(start, end);

  const {
    data: monthlySummary,
    isLoading: isMonthlySummaryLoading,
  } = useMonthlySummary(year, month);

  const totals = useMemo(() => {
    const totalIncome = dailyData.reduce((sum, d) => sum + d.totalIncome, 0);
    const totalExpenses = dailyData.reduce((sum, d) => sum + d.totalExpenses, 0);
    return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses };
  }, [dailyData]);

  const summaryIncome = period === 'month' && monthlySummary
    ? monthlySummary.totalIncome
    : totals.totalIncome;
  const summaryExpense = period === 'month' && monthlySummary
    ? monthlySummary.totalExpense
    : totals.totalExpenses;
  const summaryBalance = summaryIncome - summaryExpense;

  const barData = useMemo(
    () => dailyData.map((d) => ({
      date: formatShortDate(d.date),
      Доход: d.totalIncome,
      Расход: d.totalExpenses,
    })),
    [dailyData],
  );

  const pieData = useMemo(
    () => categoryData.filter((c) => c.totalSpent > 0),
    [categoryData],
  );

  const isLoading = isDailyLoading || isCategoryLoading || (period === 'month' && isMonthlySummaryLoading);

  return (
    <div className="min-h-dvh flex flex-col bg-surface-app text-text-primary">
      <TopNavigator
        title="Статистика"
        showBackButton={true}
        showButtons={false}
      />

      <div className="flex-1 flex flex-col gap-4 p-4 min-[480px]:p-6 max-[360px]:p-3">
        {/* Переключатель периода */}
        <div className="flex gap-2 rounded-xl bg-surface-raised p-1">
          {(['week', 'month', 'custom'] as PeriodType[]).map((p) => (
            <button
              key={p}
              type="button"
              className={clsx(
                'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 border-none cursor-pointer',
                period === p
                  ? 'bg-gradient-to-br from-btn-primary-bg to-[var(--theme-primary)] text-btn-primary-text shadow-glass'
                  : 'bg-transparent text-text-secondary hover:bg-surface-elevated',
              )}
              onClick={() => setPeriod(p)}
            >
              {p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Период'}
            </button>
          ))}
        </div>

        {/* Произвольный период */}
        {period === 'custom' && (
          <div className="flex gap-3 items-center">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="flex-1 p-2.5 rounded-xl border border-border-subtle bg-surface-raised text-text-primary text-sm focus-visible:border-border-focus focus-visible:outline-none"
            />
            <span className="text-text-tertiary text-sm">—</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="flex-1 p-2.5 rounded-xl border border-border-subtle bg-surface-raised text-text-primary text-sm focus-visible:border-border-focus focus-visible:outline-none"
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-text-secondary text-sm">Загрузка...</span>
          </div>
        ) : (
          <>
            {/* Баланс-карточка */}
            <section className="rounded-2xl bg-surface-raised shadow-glass p-4 flex flex-col gap-3">
              <div className="text-center">
                <div className="text-sm text-text-secondary mb-1">Баланс</div>
                <div className={clsx(
                  'text-2xl font-bold',
                  summaryBalance >= 0 ? 'text-income-primary' : 'text-expense-primary',
                )}>
                  {formatCurrency(summaryBalance)}
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 p-3 rounded-xl bg-income-bg border border-income-border text-center">
                  <div className="text-xs text-text-secondary mb-1">Доход</div>
                  <div className="text-base font-semibold text-income-primary">
                    {formatCurrency(summaryIncome)}
                  </div>
                </div>
                <div className="flex-1 p-3 rounded-xl bg-expense-bg border border-expense-border text-center">
                  <div className="text-xs text-text-secondary mb-1">Расход</div>
                  <div className="text-base font-semibold text-expense-primary">
                    {formatCurrency(summaryExpense)}
                  </div>
                </div>
              </div>
            </section>

            {/* График доходов/расходов по дням */}
            {barData.length > 0 && (
              <section className="rounded-2xl bg-surface-raised shadow-glass p-4">
                <h3 className="text-sm font-semibold text-text-primary m-0 mb-3">
                  Доходы и расходы по дням
                </h3>
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'var(--color-text-tertiary)', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                      />
                      <Tooltip
                        formatter={(value?: number) => formatCurrency(value ?? 0)}
                        contentStyle={{
                          backgroundColor: 'var(--color-surface-elevated)',
                          border: '1px solid var(--color-border-subtle)',
                          borderRadius: '12px',
                          color: 'var(--color-text-primary)',
                          fontSize: '13px',
                        }}
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}
                      />
                      <Bar dataKey="Доход" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Расход" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* Круговая диаграмма расходов по категориям */}
            {pieData.length > 0 && (
              <section className="rounded-2xl bg-surface-raised shadow-glass p-4">
                <h3 className="text-sm font-semibold text-text-primary m-0 mb-3">
                  Расходы по категориям
                </h3>
                <div className="w-full h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="totalSpent"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(props) => {
                          const { name, percent } = props as { name?: string; percent?: number };
                          return `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`;
                        }}
                        labelLine={false}
                      >
                        {pieData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value?: number) => formatCurrency(value ?? 0)}
                        contentStyle={{
                          backgroundColor: 'var(--color-surface-elevated)',
                          border: '1px solid var(--color-border-subtle)',
                          borderRadius: '12px',
                          color: 'var(--color-text-primary)',
                          fontSize: '13px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Легенда категорий */}
                <div className="flex flex-col gap-2 mt-3">
                  {pieData.map((cat, i) => (
                    <div key={cat.categoryName} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="text-text-secondary">{cat.categoryName}</span>
                      </div>
                      <span className="font-medium text-text-primary">{formatCurrency(cat.totalSpent)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {barData.length === 0 && pieData.length === 0 && (
              <div className="flex-1 flex items-center justify-center py-12">
                <span className="text-text-tertiary text-sm">Нет данных за выбранный период</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StatisticsPage;
