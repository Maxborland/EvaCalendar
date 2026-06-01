import clsx from 'clsx';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '../components/NavigationBar';
import TopNavigator from '../components/TopNavigator';
import { getCurrentPeriodRange, getTodayUTC } from '../domain/datePeriod';
import { formatRubles } from '../domain/moneyFormat';
import { useCategoryBreakdown, useDailyBreakdown, useMonthlySummary } from '../hooks/useSummary';

type PeriodType = 'week' | 'month' | 'custom';

const INCOME_COLOR = '#48bb78';
const EXPENSE_COLOR = '#e85d75';
const PIE_COLORS = [
  '#e85d75', '#f6ad55', '#ed8936', '#fc8181',
  '#f687b3', '#b794f4', '#76e4f7', '#68d391',
];

const formatShortDate = (dateStr: string) => {
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  return `${parseInt(parts[2], 10)}.${parts[1]}`;
};

const StatisticsPage = () => {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const navigate = useNavigate();

  const { start, end, year, month } = useMemo(() => {
    const today = getTodayUTC();
    if (period === 'week') {
      const range = getCurrentPeriodRange('week', today);
      return {
        start: range.start,
        end: range.end,
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
    const range = getCurrentPeriodRange('month', today);
    return {
      start: range.start,
      end: range.end,
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
  const selectedPeriodLabel = period === 'week'
    ? 'Текущая неделя'
    : period === 'month'
      ? 'Текущий месяц'
      : 'Выбранный период';

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
  const activeDays = useMemo(
    () => dailyData.filter((day) => day.totalIncome > 0 || day.totalExpenses > 0),
    [dailyData],
  );
  const strongestIncomeDay = useMemo(
    () => [...dailyData].sort((a, b) => b.totalIncome - a.totalIncome)[0],
    [dailyData],
  );
  const strongestExpenseDay = useMemo(
    () => [...dailyData].sort((a, b) => b.totalExpenses - a.totalExpenses)[0],
    [dailyData],
  );
  const biggestExpenseCategory = pieData[0];

  const isLoading = isDailyLoading || isCategoryLoading || (period === 'month' && isMonthlySummaryLoading);
  const openCreate = (createType: 'income' | 'expense' = 'income') => {
    navigate('/', { state: { openCreate: true, createType } });
  };

  return (
    <div className="min-h-dvh flex flex-col bg-surface-app text-text-primary">
      <TopNavigator
        title="Статистика"
        showBackButton={true}
        showButtons={false}
      />

      <main className="flex-1 flex flex-col gap-4 p-4 pb-[calc(96px+env(safe-area-inset-bottom))] max-[360px]:p-3 max-[360px]:pb-[calc(92px+env(safe-area-inset-bottom))]">
        {/* Переключатель периода */}
        <div className="flex gap-2 rounded-2xl bg-surface-raised p-1 border border-border-subtle shadow-glass">
          {(['week', 'month', 'custom'] as PeriodType[]).map((p) => (
            <button
              key={p}
              type="button"
              className={clsx(
                'flex-1 min-h-11 px-3 rounded-xl text-sm font-semibold transition-all duration-200 border-none cursor-pointer',
                period === p
                  ? 'bg-income-bg text-income-primary shadow-glass'
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
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 items-center max-[360px]:grid-cols-1">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="flex-1 p-2.5 rounded-xl border border-border-subtle bg-surface-raised text-text-primary text-sm focus-visible:border-border-focus focus-visible:outline-none"
            />
            <span className="text-text-tertiary text-sm text-center max-[360px]:hidden">—</span>
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
            <section className="rounded-2xl border border-border-subtle bg-surface-raised shadow-glass p-4 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-text-tertiary">{selectedPeriodLabel}</div>
                  <div className="mt-1 text-sm text-text-secondary">{start} - {end}</div>
                </div>
                <button
                  type="button"
                  className="shrink-0 min-h-9 rounded-xl border border-border-subtle bg-surface-elevated px-3 text-xs font-semibold text-text-secondary active:scale-[0.98]"
                  onClick={() => navigate('/money')}
                >
                  Деньги
                </button>
              </div>
              <div>
                <div className="text-sm text-text-secondary mb-1">Итог</div>
                <div className={clsx(
                  'text-3xl font-bold leading-tight',
                  summaryBalance >= 0 ? 'text-income-primary' : 'text-expense-primary',
                )}>
                  {formatRubles(summaryBalance)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-income-bg border border-income-border">
                  <div className="text-xs text-text-secondary mb-1">Доход</div>
                  <div className="text-base font-semibold text-income-primary">
                    {formatRubles(summaryIncome)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-expense-bg border border-expense-border">
                  <div className="text-xs text-text-secondary mb-1">Расход</div>
                  <div className="text-base font-semibold text-expense-primary">
                    {formatRubles(summaryExpense)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-surface-elevated px-3 py-2">
                  <div className="text-[0.6875rem] text-text-tertiary">Активных дней</div>
                  <div className="mt-0.5 text-sm font-semibold">{activeDays.length}</div>
                </div>
                <div className="rounded-xl bg-surface-elevated px-3 py-2">
                  <div className="text-[0.6875rem] text-text-tertiary">Лучший доход</div>
                  <div className="mt-0.5 truncate text-sm font-semibold text-income-primary">
                    {formatRubles(strongestIncomeDay?.totalIncome ?? 0)}
                  </div>
                </div>
                <div className="rounded-xl bg-surface-elevated px-3 py-2">
                  <div className="text-[0.6875rem] text-text-tertiary">Топ расход</div>
                  <div className="mt-0.5 truncate text-sm font-semibold text-expense-primary">
                    {formatRubles(strongestExpenseDay?.totalExpenses ?? 0)}
                  </div>
                </div>
              </div>
            </section>

            {/* График доходов/расходов по дням */}
            {barData.length > 0 && (
              <section className="rounded-2xl border border-border-subtle bg-surface-raised shadow-glass p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-sm font-semibold text-text-primary m-0">
                    По дням
                  </h3>
                  <span className="text-xs text-text-tertiary">{activeDays.length}</span>
                </div>
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 5, right: 2, left: -20, bottom: 5 }}>
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
                        formatter={(value?: number) => formatRubles(value ?? 0)}
                        contentStyle={{
                          backgroundColor: 'var(--color-surface-elevated)',
                          border: '1px solid var(--color-border-subtle)',
                          borderRadius: '12px',
                          color: 'var(--color-text-primary)',
                          fontSize: '13px',
                        }}
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
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
              <section className="rounded-2xl border border-border-subtle bg-surface-raised shadow-glass p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-sm font-semibold text-text-primary m-0">
                    Категории расходов
                  </h3>
                  {biggestExpenseCategory && (
                    <span className="min-w-0 truncate text-xs text-text-tertiary">Топ: {biggestExpenseCategory.categoryName}</span>
                  )}
                </div>
                <div className="w-full h-[210px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="totalSpent"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={78}
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
                        formatter={(value?: number) => formatRubles(value ?? 0)}
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
                      <div className="flex min-w-0 items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="truncate text-text-secondary">{cat.categoryName}</span>
                      </div>
                      <span className="shrink-0 font-medium text-text-primary">{formatRubles(cat.totalSpent)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {barData.length === 0 && pieData.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border-strong p-6 text-center">
                <span className="material-icons text-[28px] text-text-tertiary" aria-hidden="true">monitoring</span>
                <span className="text-text-tertiary text-sm">Нет данных за выбранный период</span>
                <div className="grid w-full grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="min-h-11 rounded-xl border border-income-border bg-income-bg text-income-primary text-sm font-semibold"
                    onClick={() => openCreate('income')}
                  >
                    Доход
                  </button>
                  <button
                    type="button"
                    className="min-h-11 rounded-xl border border-expense-border bg-expense-bg text-expense-primary text-sm font-semibold"
                    onClick={() => openCreate('expense')}
                  >
                    Расход
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <NavigationBar onCreateClick={() => openCreate('income')} />
    </div>
  );
};

export default StatisticsPage;
