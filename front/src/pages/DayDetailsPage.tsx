import clsx from 'clsx';
import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DetailedTaskCard from '../components/DetailedTaskCard';
import NavigationBar from '../components/NavigationBar';
import TopNavigator from '../components/TopNavigator';
import UnifiedTaskFormModal from '../components/UnifiedTaskFormModal';
import { useAuth } from '../context/useAuth';
import { useNav } from '../context/useNav';
import { formatRubles, formatSignedRubles } from '../domain/moneyFormat';
import { getLessonsWithoutIncome, getTaskMetrics } from '../domain/planningProjection';
import { useCreateTaskModal } from '../hooks/useCreateTaskModal';
import { useDeleteTask, useTasks, useUpdateTask } from '../hooks/useTasks';
import { type Task, getDailySummary } from '../services/api';
import { createDate, formatDateForDisplay, isSameDay, parseDateString } from '../utils/dateUtils';

type DayCreateType = 'income' | 'expense' | 'task' | 'lesson';

const DayDetailsPage: FC = () => {
  const { dateString } = useParams<{ dateString: string }>();
  const { data: allTasks = [] } = useTasks();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth(); // Получаем состояние аутентификации
  const { setIsModalOpen, setIsNavVisible } = useNav();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dailySummary, setDailySummary] = useState<{ totalEarned: number; totalSpent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const { openCreateModal, createModalElement } = useCreateTaskModal();

  useEffect(() => {
    if (!isAuthenticated && !isAuthLoading) {
      navigate('/login');
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  useEffect(() => {
    if (dateString) {
      try {
        const parsedDate = parseDateString(dateString);
        setSelectedDate(parsedDate);
        setError(null);
      } catch {
        // Error parsing date string
        setError("Неверный формат даты в URL.");
        return;
      }
    } else {
      setError("Дата не указана.");
    }
  }, [dateString]);

  const tasks = useMemo(() => {
    if (!dateString) return [];
    return allTasks.filter(task => isSameDay(createDate(task.dueDate), createDate(dateString)));
  }, [allTasks, dateString]);

  useEffect(() => {
    if (dateString) {
      const fetchSummary = async () => {
        try {
          const summary = await getDailySummary(dateString);
          setDailySummary(summary);
        } catch (error) {
          console.error("Failed to fetch daily summary", error);
          setDailySummary(null);
        }
      };
      fetchSummary();
    }
  }, [dateString]);

  const sortedTasks = useMemo(() => {
    const timeSpecificTasks: Task[] = [];
    const otherTasks: Task[] = [];
    const expenseTasks: Task[] = [];

    tasks.forEach(task => {
      if (task.type === 'expense') {
        expenseTasks.push(task);
      } else if (task.time && /^\d{2}:\d{2}$/.test(task.time)) {
        timeSpecificTasks.push(task);
      } else {
        otherTasks.push(task);
      }
    });

    const sortTasksByTime = (a: Task, b: Task) => {
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    };

    timeSpecificTasks.sort(sortTasksByTime);
    otherTasks.sort(sortTasksByTime);
    expenseTasks.sort(sortTasksByTime);

    return [...timeSpecificTasks, ...otherTasks, ...expenseTasks];
  }, [tasks]);

  const dayMetrics = useMemo(() => getTaskMetrics(tasks), [tasks]);

  const displayIncome = dailySummary?.totalEarned ?? dayMetrics.income;
  const displayExpense = dailySummary?.totalSpent ?? dayMetrics.expense;
  const displayBalance = displayIncome - displayExpense;

  const handleOpenTaskForm = (task?: Task, createType: DayCreateType = 'income') => {
    if (task) {
      setEditingTask(task);
      setShowTaskForm(true);
      setIsModalOpen(true);
      setIsNavVisible(false);
      return;
    }

    openCreateModal(createType, dateString ? { dueDate: dateString } : {});
  };

  const handleCreateIncomeFromLesson = (lesson: Task) => {
    const childUuid = lesson.child_uuid || lesson.childId;

    openCreateModal('income', {
      ...(lesson.dueDate || dateString ? { dueDate: lesson.dueDate || dateString } : {}),
      time: lesson.time || '',
      title: lesson.childName ? `Оплата: ${lesson.childName}` : 'Оплата за занятие',
      childId: childUuid,
      child_uuid: childUuid,
      childName: lesson.childName,
      hourlyRate: lesson.childHourlyRate ?? lesson.hourlyRate,
      hoursWorked: 1,
      address: lesson.childAddress || lesson.address,
    });
  };

  const lessonsWithoutIncome = useMemo(() => getLessonsWithoutIncome(tasks), [tasks]);
  const lessonsWithoutIncomeIds = useMemo(
    () => new Set(lessonsWithoutIncome.map((lesson) => lesson.uuid)),
    [lessonsWithoutIncome],
  );
  const hasIncomeForLesson = useCallback((lesson: Task) => {
    if (lesson.type !== 'lesson') return false;
    return !lessonsWithoutIncomeIds.has(lesson.uuid);
  }, [lessonsWithoutIncomeIds]);


  const openDayTasks = useMemo(
    () => tasks.filter((task) => task.type === 'task' && !task.completed),
    [tasks],
  );
  const focusOpenTask = openDayTasks[0];

  const handleCloseTaskForm = () => {
    setEditingTask(undefined);
    setShowTaskForm(false);
    setIsModalOpen(false);
    setIsNavVisible(true);
  };

  const handleTaskSave = async (taskData: Task | Omit<Task, 'uuid'>): Promise<void> => {
    if (!isAuthenticated && !isAuthLoading) {
      navigate('/login');
      setError("Пользователь не аутентифицирован. Невозможно сохранить задачу.");
      throw new Error("Пользователь не аутентифицирован.");
    }
    if (isAuthLoading) {
      throw new Error("Аутентификация в процессе.");
    }

    try {
      if (!('uuid' in taskData) || !taskData.uuid) {
        throw new Error('Редактирование задачи требует uuid.');
      }
      const { uuid: taskUuid, ...updateData } = taskData;
      await updateTaskMutation.mutateAsync({ uuid: taskUuid, data: updateData as Partial<Omit<Task, 'uuid'>> });
    } catch (err) {
      setError("Ошибка при сохранении задачи.");
      throw err;
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!isAuthenticated && !isAuthLoading) {
      navigate('/login');
      setError("Пользователь не аутентифицирован. Невозможно удалить задачу.");
      return;
    }
    if (isAuthLoading) return;

    try {
      await deleteTaskMutation.mutateAsync(taskId);
    } catch {
      setError("Ошибка при удалении задачи.");
    }
  };

  const handleTaskComplete = (taskId: string) => {
    updateTaskMutation.mutate(
      { uuid: taskId, data: { completed: true } },
      {
        onError: () => setError("Ошибка при закрытии задачи."),
      },
    );
  };

  const quickActions: Array<{ type: DayCreateType; label: string; icon: string; className: string }> = [
    {
      type: 'income',
      label: 'Доход',
      icon: 'add_card',
      className: 'border-income-border bg-income-bg text-income-primary',
    },
    {
      type: 'expense',
      label: 'Расход',
      icon: 'payments',
      className: 'border-expense-border bg-expense-bg text-expense-primary',
    },
    {
      type: 'lesson',
      label: 'Занятие',
      icon: 'school',
      className: 'border-[var(--color-lesson-border)] bg-[var(--color-lesson-bg)] text-[var(--color-lesson-primary)]',
    },
    {
      type: 'task',
      label: 'Задача',
      icon: 'task_alt',
      className: 'border-[var(--color-task-border)] bg-[var(--color-task-bg)] text-[var(--color-task-primary)]',
    },
  ];

  if (error) {
    return (
      <div className="text-center p-8 text-expense-primary text-lg">
        Ошибка: {error}
      </div>
    );
  }

  if (!selectedDate) {
    return (
      <div className="text-center p-8 text-expense-primary text-lg">
        Дата не найдена.
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh bg-surface-app overflow-hidden text-text-primary">
      <TopNavigator
        title={formatDateForDisplay(selectedDate)}
        showBackButton={true}
        backTo="/"
        showButtons={false}
      />

      <main className="eva-screen eva-screen--with-nav flex-1 flex flex-col gap-4 p-4 pb-[calc(96px+env(safe-area-inset-bottom))] overflow-y-auto min-h-0 scrollbar-thin max-[480px]:p-3 max-[480px]:pb-[calc(92px+env(safe-area-inset-bottom))] max-[480px]:gap-3">
        <section className="rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-glass">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-text-tertiary">День</div>
              <h1 className="m-0 mt-1 text-xl font-semibold leading-tight truncate">
                {formatDateForDisplay(selectedDate)}
              </h1>
            </div>
            <button
              type="button"
              className="shrink-0 size-11 rounded-xl border border-border-subtle bg-white/[0.04] text-text-primary inline-flex items-center justify-center active:scale-95"
              onClick={() => navigate('/')}
              aria-label="Вернуться к неделе"
            >
              <span className="material-icons text-[22px]" aria-hidden="true">calendar_view_week</span>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="col-span-2 min-w-0 rounded-xl border border-border-subtle bg-surface-elevated p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-text-secondary">Итог дня</div>
                  <div className={clsx(
                    'mt-1 text-2xl font-bold leading-tight truncate',
                    displayBalance >= 0 ? 'text-income-primary' : 'text-expense-primary',
                  )}>
                    {formatSignedRubles(displayBalance)}
                  </div>
                </div>
                <button
                  type="button"
                  className="shrink-0 min-h-10 rounded-xl border border-border-subtle bg-white/[0.04] px-3 text-xs font-semibold text-text-primary inline-flex items-center justify-center gap-1 active:scale-[0.98]"
                  onClick={() => navigate('/money')}
                >
                  <span className="material-icons text-[16px] text-text-tertiary" aria-hidden="true">account_balance_wallet</span>
                  Деньги
                </button>
              </div>
            </div>
            <div className="min-w-0 rounded-xl border border-income-border bg-income-bg p-3">
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span className="material-icons text-[15px] text-income-primary" aria-hidden="true">trending_up</span>
                Доход
              </div>
              <div className="mt-1 text-lg font-bold text-income-primary truncate">+{formatRubles(displayIncome)}</div>
            </div>
            <div className="min-w-0 rounded-xl border border-expense-border bg-expense-bg p-3">
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span className="material-icons text-[15px] text-expense-primary" aria-hidden="true">trending_down</span>
                Расход
              </div>
              <div className="mt-1 text-lg font-bold text-expense-primary truncate">-{formatRubles(displayExpense)}</div>
            </div>
            <div className="min-w-0 rounded-xl border border-[var(--color-task-border)] bg-[var(--color-task-bg)] p-3">
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span className="material-icons text-[15px] text-[var(--color-task-primary)]" aria-hidden="true">task_alt</span>
                Задачи
              </div>
              <div className="mt-1 text-lg font-bold text-[var(--color-task-primary)] truncate">{dayMetrics.openTasks}/{dayMetrics.tasks}</div>
            </div>
            <div className="min-w-0 rounded-xl border border-[var(--color-lesson-border)] bg-[var(--color-lesson-bg)] p-3">
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span className="material-icons text-[15px] text-[var(--color-lesson-primary)]" aria-hidden="true">school</span>
                Занятия
              </div>
              <div className="mt-1 text-lg font-bold text-[var(--color-lesson-primary)] truncate">{dayMetrics.lessons}</div>
            </div>
          </div>

          {(lessonsWithoutIncome.length > 0 || openDayTasks.length > 0) && (
            <div className="mt-4 rounded-xl border border-border-subtle bg-surface-elevated p-3">
              {lessonsWithoutIncome.length > 0 ? (
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
                  <span className="size-9 rounded-lg border border-income-border bg-income-bg text-income-primary inline-flex items-center justify-center">
                    <span className="material-icons text-[18px]" aria-hidden="true">add_card</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-text-primary">Внести доход за занятие</span>
                    <span className="block truncate text-[0.6875rem] text-text-tertiary">
                      {lessonsWithoutIncome.length} занятий без дохода
                    </span>
                  </span>
                  <button
                    type="button"
                    className="min-h-10 rounded-xl border border-income-border bg-income-bg px-3 text-xs font-semibold text-income-primary active:scale-[0.98]"
                    onClick={() => handleCreateIncomeFromLesson(lessonsWithoutIncome[0])}
                  >
                    Доход
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
                  <span className="size-9 rounded-lg border border-[var(--color-task-border)] bg-[var(--color-task-bg)] text-[var(--color-task-primary)] inline-flex items-center justify-center">
                    <span className="material-icons text-[18px]" aria-hidden="true">task_alt</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-text-primary">Закрыть задачу дня</span>
                    <span className="block truncate text-[0.6875rem] text-text-tertiary">
                      {focusOpenTask?.title || 'Открытая задача'}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="size-10 rounded-xl border border-income-border bg-income-bg text-income-primary inline-flex items-center justify-center active:scale-[0.98] disabled:opacity-50"
                    onClick={() => focusOpenTask?.uuid && handleTaskComplete(focusOpenTask.uuid)}
                    disabled={updateTaskMutation.isPending || !focusOpenTask?.uuid}
                    aria-label="Закрыть задачу дня"
                  >
                    <span className="material-icons text-[18px]" aria-hidden="true">check</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 grid grid-cols-4 gap-2 max-[360px]:grid-cols-2">
            {quickActions.map((action) => (
              <button
                key={action.type}
                type="button"
                className={clsx(
                  'min-h-12 rounded-xl border px-2 py-2 text-xs font-semibold inline-flex flex-col items-center justify-center gap-1 active:scale-[0.98]',
                  action.className,
                )}
                onClick={() => handleOpenTaskForm(undefined, action.type)}
              >
                <span className="material-icons text-[18px]" aria-hidden="true">{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-lg font-semibold text-text-primary leading-tight">
            План дня
          </h2>
          <span className="shrink-0 text-xs text-text-tertiary">{sortedTasks.length}</span>
        </section>

        <div className="flex flex-col gap-3">
          {tasks.length > 0 ? (
            sortedTasks.map((task, index) => (
              <DetailedTaskCard
                key={`task-${task.uuid || 'no-id'}-${index}`}
                task={task}
                onEdit={handleOpenTaskForm}
                onDelete={() => handleTaskDelete(task.uuid)}
                onComplete={handleTaskComplete}
                onCreateIncome={handleCreateIncomeFromLesson}
                hasIncomeForLesson={hasIncomeForLesson(task)}
                isMutating={updateTaskMutation.isPending}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border-strong bg-surface-raised p-6 text-center">
              <div className="text-sm text-text-tertiary">На этот день пока ничего нет</div>
              <button
                type="button"
                className="mt-4 min-h-11 rounded-xl border border-income-border bg-income-bg text-income-primary px-4 text-sm font-semibold inline-flex items-center justify-center gap-1.5"
                onClick={() => handleOpenTaskForm(undefined, 'income')}
              >
                <span className="material-icons text-[18px]" aria-hidden="true">add_card</span>
                Добавить первую запись
              </button>
            </div>
          )}
        </div>
      </main>

      <NavigationBar onCreateClick={() => handleOpenTaskForm(undefined, 'income')} />

      {showTaskForm && selectedDate && dateString && (
          <UnifiedTaskFormModal
            isOpen={showTaskForm}
            onClose={handleCloseTaskForm}
            onSubmit={handleTaskSave}
            onTaskUpsert={() => {
              handleCloseTaskForm();
            }}
            mode="edit"
            initialTaskData={editingTask}
            initialTaskType={editingTask?.type === 'expense' ? 'expense' : editingTask?.type === 'task' ? 'task' : editingTask?.type === 'lesson' ? 'lesson' : 'income'}
            onDelete={editingTask?.uuid ? () => handleTaskDelete(editingTask!.uuid!) : undefined}
          />
        )
      }
      {createModalElement}
    </div>
  );
};

export default DayDetailsPage;
