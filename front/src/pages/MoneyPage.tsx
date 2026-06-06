import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '../components/NavigationBar';
import TopNavigator from '../components/TopNavigator';
import CoreStateNotice from '../components/CoreStateNotice';
import { getCurrentPeriodRange } from '../domain/datePeriod';
import { formatRubles } from '../domain/moneyFormat';
import { getTaskAmount, isIncomeTask, isMoneyTask } from '../domain/taskRecord';
import { useCreateTaskModal } from '../hooks/useCreateTaskModal';
import { useCategoryBreakdown, useDailyBreakdown } from '../hooks/useSummary';
import { useTasks } from '../hooks/useTasks';

type MoneyPeriod = 'week' | 'month';

const MoneyPage = () => {
  const navigate = useNavigate();
  const { openCreateModal, createModalElement } = useCreateTaskModal();
  const [period, setPeriod] = useState<MoneyPeriod>('week');

  const { start, end, label } = useMemo(() => getCurrentPeriodRange(period), [period]);

  const dailyQuery = useDailyBreakdown(start, end);
  const categoryQuery = useCategoryBreakdown(start, end);
  const tasksQuery = useTasks();
  const dailyData = useMemo(() => dailyQuery.data ?? [], [dailyQuery.data]);
  const categoryData = useMemo(() => categoryQuery.data ?? [], [categoryQuery.data]);
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);

  const totals = useMemo(() => {
    const income = dailyData.reduce((sum, day) => sum + day.totalIncome, 0);
    const expense = dailyData.reduce((sum, day) => sum + day.totalExpenses, 0);
    return { income, expense, balance: income - expense };
  }, [dailyData]);

  const biggestExpenseCategory = categoryData.find((category) => category.totalSpent > 0);
  const recentOperations = useMemo(() => {
    return tasks
      .filter((task) => isMoneyTask(task) && task.dueDate >= start && task.dueDate <= end)
      .sort((a, b) => {
        const dateCompare = b.dueDate.localeCompare(a.dueDate);
        if (dateCompare !== 0) return dateCompare;
        return (b.time || '').localeCompare(a.time || '');
      })
      .slice(0, 8);
  }, [end, start, tasks]);

  const activeMoneyDays = useMemo(() => {
    return dailyData
      .filter((day) => day.totalIncome > 0 || day.totalExpenses > 0)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, period === 'week' ? 7 : 10);
  }, [dailyData, period]);

  const incomeByChild = useMemo(() => {
    const totalsByChild = new Map<string, number>();
    tasks
      .filter((task) => isIncomeTask(task) && task.dueDate >= start && task.dueDate <= end)
      .forEach((task) => {
        const childName = task.childName || 'Без ребенка';
        totalsByChild.set(childName, (totalsByChild.get(childName) || 0) + getTaskAmount(task));
      });

    return [...totalsByChild.entries()]
      .map(([childName, total]) => ({ childName, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [end, start, tasks]);

  const isLoading = (dailyQuery.isLoading && !dailyQuery.data) || (categoryQuery.isLoading && !categoryQuery.data) || (tasksQuery.isLoading && !tasksQuery.data);
  const hasInitialMoneyError =
    (dailyQuery.isError && dailyData.length === 0) ||
    (categoryQuery.isError && categoryData.length === 0) ||
    (tasksQuery.isError && tasks.length === 0);

  const retryMoneyData = () => {
    dailyQuery.refetch();
    categoryQuery.refetch();
    tasksQuery.refetch();
  };

  return (
    <div className="min-h-dvh flex flex-col bg-surface-app text-text-primary">
      <TopNavigator title="Деньги" showButtons={false} />
      <main className="eva-screen eva-screen--with-nav flex-1 flex flex-col gap-4 p-4 pb-[calc(96px+env(safe-area-inset-bottom))] max-[360px]:p-3 max-[360px]:pb-[calc(92px+env(safe-area-inset-bottom))]">
        <section className="flex gap-2 rounded-2xl bg-surface-raised p-1 border border-border-subtle shadow-glass" aria-label="Период">
          {(['week', 'month'] as MoneyPeriod[]).map((periodValue) => (
            <button
              key={periodValue}
              type="button"
              aria-pressed={period === periodValue}
              className={`flex-1 min-h-11 rounded-xl border-none text-sm font-semibold transition-all duration-200 ${
                period === periodValue
                  ? 'bg-income-bg text-income-primary shadow-glass'
                  : 'bg-transparent text-text-secondary'
              }`}
              onClick={() => setPeriod(periodValue)}
            >
              {periodValue === 'week' ? 'Неделя' : 'Месяц'}
            </button>
          ))}
        </section>

        <section className="rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-glass">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-text-tertiary">{label}</div>
              <div className="mt-1 text-sm text-text-secondary">{start} - {end}</div>
            </div>
            <span className="material-icons text-income-primary text-[28px]" aria-hidden="true">account_balance_wallet</span>
          </div>
          <div className={`mt-4 text-3xl font-bold leading-tight ${totals.balance >= 0 ? 'text-income-primary' : 'text-expense-primary'}`}>
            {hasInitialMoneyError ? 'Не загружено' : isLoading ? '...' : formatRubles(totals.balance)}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-income-border bg-income-bg p-3">
              <div className="text-xs text-text-secondary">Доход</div>
              <div className="mt-1 text-lg font-bold text-income-primary">{hasInitialMoneyError ? '—' : formatRubles(totals.income)}</div>
            </div>
            <div className="rounded-xl border border-expense-border bg-expense-bg p-3">
              <div className="text-xs text-text-secondary">Расход</div>
              <div className="mt-1 text-lg font-bold text-expense-primary">{hasInitialMoneyError ? '—' : formatRubles(totals.expense)}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="min-h-11 rounded-xl border border-income-border bg-income-bg text-income-primary text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98]"
              onClick={() => openCreateModal('income')}
            >
              <span className="material-icons text-[18px]" aria-hidden="true">add_card</span>
              Доход
            </button>
            <button
              type="button"
              className="min-h-11 rounded-xl border border-expense-border bg-expense-bg text-expense-primary text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98]"
              onClick={() => openCreateModal('expense')}
            >
              <span className="material-icons text-[18px]" aria-hidden="true">payments</span>
              Расход
            </button>
          </div>
          <button
            type="button"
            className="mt-3 min-h-11 w-full rounded-xl border border-border-subtle bg-surface-elevated text-text-primary text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98]"
            onClick={() => navigate('/statistics')}
          >
            <span className="material-icons text-[18px] text-text-tertiary" aria-hidden="true">monitoring</span>
            Подробная статистика
          </button>
        </section>

        {hasInitialMoneyError && (
          <CoreStateNotice
            tone="error"
            title="Не удалось обновить деньги"
            description="Не показываю нули как итог периода: часть финансовых данных не загрузилась."
            actionLabel="Повторить загрузку"
            onAction={retryMoneyData}
          />
        )}

        <section className="rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-glass">
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-base font-semibold">Дни с движением</h2>
            <span className="text-xs text-text-tertiary">{activeMoneyDays.length}</span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {hasInitialMoneyError ? (
              <CoreStateNotice
                tone="error"
                title="Дни с движением недоступны"
                description="Данные по доходам и расходам за период не загрузились."
                actionLabel="Повторить"
                onAction={retryMoneyData}
                className="shadow-none"
              />
            ) : activeMoneyDays.length > 0 ? (
              activeMoneyDays.map((day) => {
                const balance = day.totalIncome - day.totalExpenses;
                return (
                  <button
                    key={day.date}
                    type="button"
                    className="rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2 text-left grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center active:scale-[0.99]"
                    onClick={() => navigate(`/day/${day.date}`)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-text-primary">{day.date}</span>
                      <span className="mt-0.5 grid grid-cols-2 gap-2 text-[0.6875rem]">
                        <span className="truncate text-income-primary">+{formatRubles(day.totalIncome)}</span>
                        <span className="truncate text-expense-primary">-{formatRubles(day.totalExpenses)}</span>
                      </span>
                    </span>
                    <span className={`shrink-0 text-sm font-bold ${balance >= 0 ? 'text-income-primary' : 'text-expense-primary'}`}>
                      {formatRubles(balance)}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-border-strong p-4 text-center">
                <div className="text-sm text-text-tertiary">Движения денег за период нет</div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="min-h-11 rounded-xl border border-income-border bg-income-bg px-3 text-sm font-semibold text-income-primary inline-flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    onClick={() => openCreateModal('income')}
                  >
                    <span className="material-icons text-[18px]" aria-hidden="true">add_card</span>
                    Доход
                  </button>
                  <button
                    type="button"
                    className="min-h-11 rounded-xl border border-expense-border bg-expense-bg px-3 text-sm font-semibold text-expense-primary inline-flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    onClick={() => openCreateModal('expense')}
                  >
                    <span className="material-icons text-[18px]" aria-hidden="true">payments</span>
                    Расход
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-glass">
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-base font-semibold">Доходы по детям</h2>
            <span className="text-xs text-text-tertiary">топ периода</span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {hasInitialMoneyError ? (
              <CoreStateNotice
                tone="error"
                title="Доходы по детям недоступны"
                description="Связь денег с детьми не загрузилась, поэтому не делаю выводов по периоду."
                actionLabel="Повторить"
                onAction={retryMoneyData}
                className="shadow-none"
              />
            ) : incomeByChild.length > 0 ? (
              incomeByChild.map((item) => (
                <div key={item.childName} className="flex items-center justify-between gap-3 rounded-xl bg-surface-elevated px-3 py-2">
                  <span className="min-w-0 truncate text-sm text-text-primary">{item.childName}</span>
                  <span className="shrink-0 text-sm font-semibold text-income-primary">{formatRubles(item.total)}</span>
                </div>
              ))
            ) : (
              <button
                type="button"
                className="min-h-11 rounded-xl border border-dashed border-income-border bg-income-bg px-3 py-2 text-left text-income-primary grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 active:scale-[0.99]"
                onClick={() => navigate('/children')}
              >
                <span className="material-icons text-[18px]" aria-hidden="true">groups</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">Доходов по детям пока нет</span>
                  <span className="block truncate text-[0.6875rem] text-text-secondary">Открой детей, чтобы внести оплату по ставке</span>
                </span>
                <span className="material-icons text-[18px]" aria-hidden="true">chevron_right</span>
              </button>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-glass">
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-base font-semibold">Расходы по категориям</h2>
            {biggestExpenseCategory && (
              <span className="text-xs text-text-tertiary truncate">Топ: {biggestExpenseCategory.categoryName}</span>
            )}
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {hasInitialMoneyError ? (
              <CoreStateNotice
                tone="error"
                title="Категории расходов недоступны"
                description="Расходы по категориям не загрузились."
                actionLabel="Повторить"
                onAction={retryMoneyData}
                className="shadow-none"
              />
            ) : categoryData.filter((category) => category.totalSpent > 0).length > 0 ? (
              categoryData
                .filter((category) => category.totalSpent > 0)
                .slice(0, 6)
                .map((category) => (
                  <div key={category.categoryName} className="flex items-center justify-between gap-3 rounded-xl bg-surface-elevated px-3 py-2">
                    <span className="min-w-0 truncate text-sm text-text-primary">{category.categoryName}</span>
                    <span className="shrink-0 text-sm font-semibold text-expense-primary">{formatRubles(category.totalSpent)}</span>
                  </div>
                ))
            ) : (
              <div className="rounded-xl border border-dashed border-border-strong p-4 text-center text-sm text-text-tertiary">
                Расходов за период нет
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-glass">
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-base font-semibold">Последние операции</h2>
            <span className="text-xs text-text-tertiary">{recentOperations.length}</span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {hasInitialMoneyError ? (
              <CoreStateNotice
                tone="error"
                title="Операции недоступны"
                description="Последние доходы и расходы не загрузились."
                actionLabel="Повторить"
                onAction={retryMoneyData}
                className="shadow-none"
              />
            ) : recentOperations.length > 0 ? (
              recentOperations.map((task) => {
                const isExpense = task.type === 'expense';
                const amount = getTaskAmount(task);
                return (
                  <button
                    key={task.uuid}
                    type="button"
                    className="w-full rounded-xl border border-transparent bg-surface-elevated px-3 py-2 text-left active:scale-[0.99]"
                    onClick={() => navigate(`/day/${task.dueDate}`)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-text-primary">{task.title || (isExpense ? 'Расход' : 'Доход')}</div>
                        <div className="mt-0.5 truncate text-xs text-text-tertiary">
                          {task.dueDate}
                          {task.childName ? ` · ${task.childName}` : ''}
                          {task.expenseCategoryName ? ` · ${task.expenseCategoryName}` : ''}
                        </div>
                      </div>
                      <span className={`shrink-0 text-sm font-bold ${isExpense ? 'text-expense-primary' : 'text-income-primary'}`}>
                        {isExpense ? '-' : '+'}{formatRubles(amount)}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-border-strong p-4 text-center">
                <div className="text-sm text-text-tertiary">Операций за период нет</div>
                <button
                  type="button"
                  className="mt-3 min-h-11 w-full rounded-xl border border-income-border bg-income-bg px-3 text-sm font-semibold text-income-primary inline-flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  onClick={() => openCreateModal('income')}
                >
                  <span className="material-icons text-[18px]" aria-hidden="true">add_card</span>
                  Добавить первую операцию
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      <NavigationBar onCreateClick={() => openCreateModal('income')} />
      {createModalElement}
    </div>
  );
};

export default MoneyPage;
