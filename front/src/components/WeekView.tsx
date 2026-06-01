import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useNav } from '../context/useNav';
import {
  getLessonsWithoutIncome,
  getNextVisibleTasks,
  getOverdueTasks,
  getTaskMetrics,
  getTasksForDate as getTasksForDateProjection,
  getWeekMetrics,
} from '../domain/planningProjection';
import {
  getTaskAmount,
  isIncomeTask,
} from '../domain/taskRecord';
import { useSwipe } from '../hooks/useSwipe';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useDuplicateTask } from '../hooks/useTasks';
import type { Task } from '../services/api';
import {
  addDays,
  addWeeks,
  createDate,
  formatDateRange,
  isSameDay,
  startOfISOWeek,
  subtractWeeks
} from '../utils/dateUtils';
import DayColumn from './DayColumn';
import NoteField from './NoteField';
import TopNavigator from './TopNavigator';
import UnifiedTaskFormModal from './UnifiedTaskFormModal';
import NavigationBar from './NavigationBar';
import CoreStateNotice from './CoreStateNotice';

const formatCompactMoney = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
    notation: Math.abs(value) >= 10000 ? 'compact' : 'standard',
  }).format(value);

const getTodayItemMeta = (task: Task) => {
  if (task.type === 'expense') {
    return {
      label: 'Расход',
      icon: 'trending_down',
      className: 'border-expense-border bg-expense-bg text-expense-primary',
    };
  }
  if (isIncomeTask(task)) {
    return {
      label: 'Доход',
      icon: 'trending_up',
      className: 'border-income-border bg-income-bg text-income-primary',
    };
  }
  if (task.type === 'lesson') {
    return {
      label: 'Занятие',
      icon: 'school',
      className: 'border-[var(--color-lesson-border)] bg-[var(--color-lesson-bg)] text-[var(--color-lesson-primary)]',
    };
  }
  return {
    label: task.completed ? 'Готово' : 'Задача',
    icon: task.completed ? 'check_circle' : 'task_alt',
    className: task.completed
      ? 'border-income-border bg-income-bg text-income-primary'
      : 'border-[var(--color-task-border)] bg-[var(--color-task-bg)] text-[var(--color-task-primary)]',
  };
};

type CreateTaskType = 'income' | 'expense' | 'task' | 'lesson';

const isCreateType = (value: unknown): value is CreateTaskType =>
  value === 'income' || value === 'expense' || value === 'task' || value === 'lesson';

const getCreateDefaultsFromRouteState = (state: unknown): Partial<Task> => {
  if (!state || typeof state !== 'object') return {};

  const routeState = state as { createDefaults?: unknown };
  if (!routeState.createDefaults || typeof routeState.createDefaults !== 'object') return {};

  return routeState.createDefaults as Partial<Task>;
};

const WeekView = () => {
  const tasksQuery = useTasks();
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // React Query мутации
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const duplicateTaskMutation = useDuplicateTask();
  const getTodayUTC = () => {
    const today = new Date();
    return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  };
  const [currentDate, setCurrentDate] = useState(getTodayUTC());
  const [today] = useState(getTodayUTC());
  const weekDays = useMemo<Date[]>(() => {
    const startOfWeek = startOfISOWeek(currentDate);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(startOfWeek, i));
    }
    return days;
  }, [currentDate]);
  const { isNavVisible, setIsNavVisible, isModalOpen: isGlobalModalOpen, setIsModalOpen: setIsGlobalModalOpen } = useNav();
  const gridRef = useRef<HTMLElement>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalTaskMode, setModalTaskMode] = useState<'create' | 'edit'>('create');
  const [currentTaskForModal, setCurrentTaskForModal] = useState<Task | undefined>(undefined);
  const [initialModalTaskType, setInitialModalTaskType] = useState<CreateTaskType>('income');


  useEffect(() => {
    if (!isAuthenticated && !isAuthLoading) {
      navigate('/login');
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      if (isGlobalModalOpen || isTaskModalOpen) return;

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setIsNavVisible, isGlobalModalOpen, isTaskModalOpen]);


  const goToPreviousWeek = () => {
    setCurrentDate(subtractWeeks(currentDate, 1));
  };

  const goToNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  useSwipe(gridRef, {
    onSwipeLeft: goToNextWeek,
    onSwipeRight: goToPreviousWeek,
    enabled: !isTaskModalOpen,
  });

  const orderedWeekCells = useMemo(() => {
    if (weekDays.length !== 7) return [];
    return [
      { id: weekDays[0].toISOString(), type: 'day' as const, date: weekDays[0] },
      { id: weekDays[3].toISOString(), type: 'day' as const, date: weekDays[3] },
      { id: weekDays[1].toISOString(), type: 'day' as const, date: weekDays[1] },
      { id: weekDays[4].toISOString(), type: 'day' as const, date: weekDays[4] },
      { id: weekDays[2].toISOString(), type: 'day' as const, date: weekDays[2] },
      { id: weekDays[5].toISOString(), type: 'day' as const, date: weekDays[5] },
      { id: 'week-notes', type: 'note' as const, date: weekDays[0] },
      { id: weekDays[6].toISOString(), type: 'day' as const, date: weekDays[6] },
    ];
  }, [weekDays]);

  const getTasksForDate = useCallback(
    (targetDate: Date) =>
      getTasksForDateProjection(tasks, targetDate),
    [tasks]
  );

  const todayDateString = useMemo(() => createDate(today).toISOString().slice(0, 10), [today]);

  const todayTasks = useMemo(() => getTasksForDate(today), [getTasksForDate, today]);

  const todayMetrics = useMemo(() => getTaskMetrics(todayTasks), [todayTasks]);

  const nextTodayTasks = useMemo(() => getNextVisibleTasks(todayTasks), [todayTasks]);

  const overdueTasks = useMemo(() => getOverdueTasks(tasks, todayDateString), [tasks, todayDateString]);

  const todayLessonsWithoutIncome = useMemo(() => getLessonsWithoutIncome(todayTasks), [todayTasks]);

  const todayFocus = useMemo(() => {
    if (overdueTasks.length > 0) {
      return {
        tone: 'danger' as const,
        eyebrow: 'Нужно разобрать',
        title: `${overdueTasks.length} просроченных задач`,
        detail: 'Открой задачи и закрой хвосты, чтобы день не начинался с долга.',
      };
    }

    const unpaidLesson = todayLessonsWithoutIncome[0];
    if (unpaidLesson) {
      return {
        tone: 'income' as const,
        eyebrow: 'После занятия',
        title: unpaidLesson.childName ? `Внести оплату: ${unpaidLesson.childName}` : 'Внести доход за занятие',
        detail: `${unpaidLesson.time || 'Занятие'}${unpaidLesson.childName ? ` · ${unpaidLesson.childName}` : ''}`,
      };
    }

    const nextTask = nextTodayTasks[0];
    if (nextTask) {
      return {
        tone: 'normal' as const,
        eyebrow: 'Ближайшее сегодня',
        title: nextTask.title || getTodayItemMeta(nextTask).label,
        detail: `${nextTask.time || getTodayItemMeta(nextTask).label}${nextTask.childName ? ` · ${nextTask.childName}` : ''}`,
      };
    }

    return {
      tone: 'clear' as const,
      eyebrow: 'Сегодня',
      title: 'День свободен',
      detail: 'Можно добавить занятие, доход, расход или задачу.',
    };
  }, [nextTodayTasks, overdueTasks, todayLessonsWithoutIncome]);

  const weeklyMetrics = useMemo(() => getWeekMetrics(tasks, weekDays), [tasks, weekDays]);
  const weeklyBalance = weeklyMetrics.income - weeklyMetrics.expense;
  const isInitialTasksLoading = tasksQuery.isLoading && !tasksQuery.data;
  const hasInitialTasksError = tasksQuery.isError && tasks.length === 0;

  const handleOpenTaskModal = useCallback((taskToEdit?: Task, taskType?: CreateTaskType, defaultDate?: Date, createDefaults?: Partial<Task>) => {
    if (taskToEdit) {
      setCurrentTaskForModal(taskToEdit);
      setModalTaskMode('edit');
      setInitialModalTaskType(taskType || (taskToEdit.type === 'expense' ? 'expense' : taskToEdit.type === 'task' ? 'task' : taskToEdit.type === 'lesson' ? 'lesson' : 'income'));
    } else {
      setCurrentTaskForModal({
        dueDate: createDate(defaultDate || today).toISOString().slice(0, 10),
        ...createDefaults,
      } as Task);
      setModalTaskMode('create');
      setInitialModalTaskType(taskType || 'income');
    }
    setIsTaskModalOpen(true);
    setIsGlobalModalOpen(true);
    setIsNavVisible(false);
  }, [today, setIsGlobalModalOpen, setIsNavVisible]);

  const handleCreateIncomeFromLesson = useCallback((lesson: Task) => {
    const childUuid = lesson.child_uuid || lesson.childId;

    handleOpenTaskModal(undefined, 'income', createDate(lesson.dueDate || today), {
      title: lesson.childName ? `Оплата: ${lesson.childName}` : 'Оплата за занятие',
      time: lesson.time || undefined,
      childId: childUuid,
      child_uuid: childUuid,
      childName: lesson.childName,
      hourlyRate: lesson.childHourlyRate ?? lesson.hourlyRate,
      hoursWorked: 1,
      address: lesson.childAddress || lesson.address,
    });
  }, [handleOpenTaskModal, today]);

  useEffect(() => {
    if (location.state && typeof location.state === 'object' && 'openCreate' in location.state) {
      const createType = 'createType' in location.state && isCreateType(location.state.createType)
        ? location.state.createType
        : 'income';
      handleOpenTaskModal(undefined, createType, today, getCreateDefaultsFromRouteState(location.state));
      navigate('.', { replace: true, state: null });
    }
  }, [handleOpenTaskModal, location.state, navigate, today]);

  const handleCloseTaskModal = useCallback(() => {
    setIsTaskModalOpen(false);
    setCurrentTaskForModal(undefined);
    setIsGlobalModalOpen(false);
    setIsNavVisible(true);
  }, [setIsGlobalModalOpen, setIsNavVisible]);

  const handleSubmitTask = async (taskData: Task | Omit<Task, 'uuid'>): Promise<void> => {
    if (!isAuthenticated && !isAuthLoading) {
      navigate('/login');
      throw new Error("Пользователь не аутентифицирован.");
    }
    if (isAuthLoading) {
      throw new Error("Аутентификация в процессе.");
    }

    if ('uuid' in taskData && taskData.uuid) {
      const { uuid, ...updateData } = taskData;
      await updateTaskMutation.mutateAsync({ uuid, data: updateData as Partial<Omit<Task, 'uuid'>> });
    } else {
      await createTaskMutation.mutateAsync(taskData as Omit<Task, 'uuid'>);
    }
  };

  const handleCompleteTask = async (id: string) => {
    if (!isAuthenticated && !isAuthLoading) {
      navigate('/login');
      return;
    }
    if (isAuthLoading) return;

    await updateTaskMutation.mutateAsync({ uuid: id, data: { completed: true } });
  };

  const handleDeleteTask = async (id: string) => {
    if (!isAuthenticated && !isAuthLoading) {
      navigate('/login');
      return;
    }
    if (isAuthLoading) return;

    try {
      await deleteTaskMutation.mutateAsync(id);
      handleCloseTaskModal();
    } catch {
      // Ошибка обрабатывается в мутации
    }
  };

  const handleDuplicateTask = async (id: string) => {
    if (!isAuthenticated && !isAuthLoading) {
      navigate('/login');
      return;
    }
    if (isAuthLoading) return;

    try {
      await duplicateTaskMutation.mutateAsync(id);
      handleCloseTaskModal();
    } catch {
      // Ошибка обрабатывается в мутации
    }
  };


  return (
    <div className="min-h-dvh flex flex-col bg-surface-app">
      <TopNavigator title="План недели" showButtons={false} />
      <main
        id="main-content"
        className="flex-1 flex flex-col gap-[var(--spacing-md)] p-[var(--spacing-md)] pb-[calc(96px+env(safe-area-inset-bottom))] min-[480px]:gap-[var(--spacing-lg)] min-[480px]:p-[var(--spacing-lg)] min-[480px]:pb-[calc(96px+env(safe-area-inset-bottom))] max-[360px]:gap-[var(--spacing-sm)] max-[360px]:p-[var(--spacing-sm)] max-[360px]:pb-[calc(92px+env(safe-area-inset-bottom))]"
      >
        {isInitialTasksLoading ? (
          <CoreStateNotice
            tone="loading"
            title="Загружаю неделю"
            description="Сейчас подтяну план, деньги, занятия и задачи."
          />
        ) : hasInitialTasksError ? (
          <CoreStateNotice
            tone="error"
            title="Не удалось загрузить неделю"
            description="Не показываю пустую неделю как факт, потому что данные не пришли. Проверьте связь или попробуйте снова."
            actionLabel="Повторить загрузку"
            onAction={() => tasksQuery.refetch()}
          />
        ) : (
          <>
        <section
          className="rounded-2xl border border-border-subtle bg-surface-raised p-3 shadow-glass"
          aria-label="Фокус дня"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-text-tertiary leading-tight">{todayFocus.eyebrow}</div>
              <h1 className="m-0 mt-1 text-lg font-semibold text-text-primary leading-tight truncate">
                {todayFocus.title}
              </h1>
              <p className="m-0 mt-1 text-xs text-text-tertiary leading-tight line-clamp-2">
                {todayFocus.detail}
              </p>
            </div>
            <button
              type="button"
              className={`shrink-0 min-h-11 rounded-xl border px-3 text-sm font-semibold inline-flex items-center justify-center gap-1.5 active:scale-95 ${
                todayFocus.tone === 'danger'
                  ? 'border-expense-border bg-expense-bg text-expense-primary'
                  : todayFocus.tone === 'income'
                    ? 'border-income-border bg-income-bg text-income-primary'
                  : 'border-border-subtle bg-white/[0.04] text-text-primary'
              }`}
              onClick={() => {
                if (todayFocus.tone === 'danger') {
                  navigate('/tasks');
                  return;
                }
                if (todayFocus.tone === 'income' && todayLessonsWithoutIncome[0]) {
                  handleCreateIncomeFromLesson(todayLessonsWithoutIncome[0]);
                  return;
                }
                navigate(`/day/${todayDateString}`);
              }}
            >
              <span className="material-icons text-[18px]" aria-hidden="true">
                {todayFocus.tone === 'danger' ? 'priority_high' : todayFocus.tone === 'income' ? 'add_card' : 'today'}
              </span>
              {todayFocus.tone === 'danger' ? 'Задачи' : todayFocus.tone === 'income' ? 'Доход' : 'День'}
            </button>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-1.5">
            <div className="min-w-0 rounded-xl border border-income-border bg-income-bg p-2">
              <div className="text-[0.6875rem] text-text-secondary leading-tight">Доход</div>
              <div className="mt-1 text-sm font-bold text-income-primary leading-tight truncate">+{formatCompactMoney(todayMetrics.income)} ₽</div>
            </div>
            <div className="min-w-0 rounded-xl border border-expense-border bg-expense-bg p-2">
              <div className="text-[0.6875rem] text-text-secondary leading-tight">Расход</div>
              <div className="mt-1 text-sm font-bold text-expense-primary leading-tight truncate">-{formatCompactMoney(todayMetrics.expense)} ₽</div>
            </div>
            <div className="min-w-0 rounded-xl border border-[var(--color-task-border)] bg-[var(--color-task-bg)] p-2">
              <div className="text-[0.6875rem] text-text-secondary leading-tight">Задачи</div>
              <div className="mt-1 text-sm font-bold text-[var(--color-task-primary)] leading-tight truncate">{todayMetrics.openTasks}/{todayMetrics.tasks}</div>
            </div>
            <div className="min-w-0 rounded-xl border border-[var(--color-lesson-border)] bg-[var(--color-lesson-bg)] p-2">
              <div className="text-[0.6875rem] text-text-secondary leading-tight">Занятия</div>
              <div className="mt-1 text-sm font-bold text-[var(--color-lesson-primary)] leading-tight truncate">{todayMetrics.lessons}</div>
            </div>
          </div>

          {overdueTasks.length > 0 && (
            <button
              type="button"
              className="mt-3 min-h-11 w-full rounded-xl border border-expense-border bg-expense-bg px-3 py-2 text-left text-expense-primary grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 active:scale-[0.99]"
              onClick={() => navigate('/tasks')}
            >
              <span className="material-icons text-[19px]" aria-hidden="true">priority_high</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">Есть просроченные задачи</span>
                <span className="block truncate text-[0.6875rem] text-text-secondary">
                  {overdueTasks.length} требуют решения
                </span>
              </span>
              <span className="material-icons text-[18px]" aria-hidden="true">chevron_right</span>
            </button>
          )}

          {nextTodayTasks.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5">
              {nextTodayTasks.map((task) => {
                const meta = getTodayItemMeta(task);
                const amount = getTaskAmount(task);
                return (
                  <div
                    key={task.uuid}
                    className="min-h-12 rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2 text-left grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2"
                  >
                    <span className={`size-8 rounded-lg border inline-flex items-center justify-center ${meta.className}`}>
                      <span className="material-icons text-[16px]" aria-hidden="true">{meta.icon}</span>
                    </span>
                    <button
                      type="button"
                      className="min-h-11 min-w-0 text-left border-none bg-transparent p-0 flex flex-col justify-center active:scale-[0.99]"
                      onClick={() => handleOpenTaskModal(task)}
                    >
                      <span className="block truncate text-sm font-semibold text-text-primary">{task.title || meta.label}</span>
                      <span className="block truncate text-[0.6875rem] text-text-tertiary">
                        {task.time || meta.label}{task.childName ? ` · ${task.childName}` : ''}
                      </span>
                    </button>
                    {(task.type === 'expense' || isIncomeTask(task)) && amount > 0 && (
                      <span className={task.type === 'expense' ? 'text-xs font-bold text-expense-primary' : 'text-xs font-bold text-income-primary'}>
                        {task.type === 'expense' ? '-' : '+'}{formatCompactMoney(amount)} ₽
                      </span>
                    )}
                    {task.type === 'task' && !task.completed && (
                      <button
                        type="button"
                        className="size-11 rounded-xl border border-income-border bg-income-bg text-income-primary inline-flex items-center justify-center active:scale-95 disabled:opacity-50"
                        onClick={() => handleCompleteTask(task.uuid)}
                        disabled={updateTaskMutation.isPending}
                        aria-label="Закрыть задачу"
                      >
                        <span className="material-icons text-[20px]" aria-hidden="true">check</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-3 grid grid-cols-4 gap-1.5 max-[360px]:grid-cols-2">
            {([
              { type: 'income' as const, label: 'Доход', icon: 'add_card', className: 'border-income-border bg-income-bg text-income-primary' },
              { type: 'expense' as const, label: 'Расход', icon: 'payments', className: 'border-expense-border bg-expense-bg text-expense-primary' },
              { type: 'lesson' as const, label: 'Занятие', icon: 'school', className: 'border-[var(--color-lesson-border)] bg-[var(--color-lesson-bg)] text-[var(--color-lesson-primary)]' },
              { type: 'task' as const, label: 'Задача', icon: 'task_alt', className: 'border-[var(--color-task-border)] bg-[var(--color-task-bg)] text-[var(--color-task-primary)]' },
            ]).map((action) => (
              <button
                key={action.type}
                type="button"
                className={`min-h-11 rounded-xl border px-2 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1 active:scale-[0.98] ${action.className}`}
                onClick={() => handleOpenTaskModal(undefined, action.type, today)}
              >
                <span className="material-icons text-[17px]" aria-hidden="true">{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section
          className="rounded-2xl border border-border-subtle bg-surface-raised p-2 shadow-glass"
          aria-label="Итоги недели"
        >
          <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl bg-surface-elevated px-3 py-2">
            <div className="min-w-0">
              <div className="text-[0.6875rem] text-text-tertiary leading-tight">Итог недели</div>
              <div className={`mt-0.5 text-lg font-bold leading-tight truncate ${weeklyBalance >= 0 ? 'text-income-primary' : 'text-expense-primary'}`}>
                {weeklyBalance >= 0 ? '+' : '-'}{formatCompactMoney(Math.abs(weeklyBalance))} ₽
              </div>
              <div className="mt-0.5 text-[0.6875rem] text-text-tertiary leading-tight">
                Активных дней: {weeklyMetrics.activeDays}/7 · детей: {weeklyMetrics.children}
              </div>
            </div>
            <button
              type="button"
              className="min-h-11 rounded-xl border border-border-subtle bg-white/[0.04] px-3 text-xs font-semibold text-text-primary inline-flex items-center justify-center gap-1 active:scale-[0.98]"
              onClick={() => navigate('/money')}
            >
              <span className="material-icons text-[16px] text-text-tertiary" aria-hidden="true">account_balance_wallet</span>
              Деньги
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="min-w-0 rounded-xl border border-income-border bg-income-bg p-2">
              <div className="flex items-center gap-1 text-[0.6875rem] text-text-secondary leading-tight">
                <span className="material-icons text-[14px] text-income-primary" aria-hidden="true">trending_up</span>
                <span className="truncate">Доход</span>
              </div>
              <div className="mt-1 text-sm font-bold text-income-primary leading-tight truncate">
                +{formatCompactMoney(weeklyMetrics.income)} ₽
              </div>
            </div>
            <div className="min-w-0 rounded-xl border border-expense-border bg-expense-bg p-2">
              <div className="flex items-center gap-1 text-[0.6875rem] text-text-secondary leading-tight">
                <span className="material-icons text-[14px] text-expense-primary" aria-hidden="true">trending_down</span>
                <span className="truncate">Расход</span>
              </div>
              <div className="mt-1 text-sm font-bold text-expense-primary leading-tight truncate">
                -{formatCompactMoney(weeklyMetrics.expense)} ₽
              </div>
            </div>
            <div className="min-w-0 rounded-xl border border-[var(--color-task-border)] bg-[var(--color-task-bg)] p-2">
              <div className="flex items-center gap-1 text-[0.6875rem] text-text-secondary leading-tight">
                <span className="material-icons text-[14px] text-[var(--color-task-primary)]" aria-hidden="true">task_alt</span>
                <span className="truncate">Задачи</span>
              </div>
              <div className="mt-1 text-sm font-bold text-[var(--color-task-primary)] leading-tight truncate">
                {weeklyMetrics.openTasks}/{weeklyMetrics.tasks}
              </div>
            </div>
            <div className="min-w-0 rounded-xl border border-[var(--color-lesson-border)] bg-[var(--color-lesson-bg)] p-2">
              <div className="flex items-center gap-1 text-[0.6875rem] text-text-secondary leading-tight">
                <span className="material-icons text-[14px] text-[var(--color-lesson-primary)]" aria-hidden="true">school</span>
                <span className="truncate">Занятия</span>
              </div>
              <div className="mt-1 text-sm font-bold text-[var(--color-lesson-primary)] leading-tight truncate">
                {weeklyMetrics.lessons}
              </div>
            </div>
          </div>
        </section>
        <section className="flex items-center justify-between gap-2 rounded-2xl border border-border-subtle bg-surface-raised p-2 shadow-glass" aria-label="Переключение недели">
          <button
            type="button"
            className="size-11 rounded-xl border border-border-subtle bg-white/[0.04] text-text-primary inline-flex items-center justify-center active:scale-95 [&_.material-icons]:text-[22px]"
            onClick={goToPreviousWeek}
            aria-label="Предыдущая неделя"
          >
            <span className="material-icons" aria-hidden="true">chevron_left</span>
          </button>
          <div className="min-w-0 text-center">
            <div className="text-xs text-text-tertiary leading-tight">Неделя</div>
            <div className="text-sm font-semibold text-text-primary leading-tight truncate">
              {weekDays.length === 7 ? formatDateRange(weekDays[0], weekDays[6]) : ''}
            </div>
          </div>
          <button
            type="button"
            className="size-11 rounded-xl border border-border-subtle bg-white/[0.04] text-text-primary inline-flex items-center justify-center active:scale-95 [&_.material-icons]:text-[22px]"
            onClick={goToNextWeek}
            aria-label="Следующая неделя"
          >
            <span className="material-icons" aria-hidden="true">chevron_right</span>
          </button>
        </section>
        <section
          ref={gridRef}
          className="grid grid-cols-2 auto-rows-[minmax(140px,auto)] gap-[var(--spacing-sm)] content-start min-[480px]:gap-[var(--spacing-md)] max-[360px]:gap-1.5"
          aria-label="План недели"
        >
          {orderedWeekCells.map((cell) => {
            if (cell.type === 'note') {
              const noteWeekId = createDate(cell.date).toISOString().slice(0, 10);
              return (
                <article key={cell.id} className="min-w-0 flex self-stretch [&>*]:flex-1 [&>*]:min-w-0">
                  <NoteField weekId={noteWeekId} />
                </article>
              );
            }

            return (
              <article key={cell.id} className="min-w-0 flex [&>*]:flex-1 [&>*]:min-w-0">
                <DayColumn
                  fullDate={cell.date}
                  today={today}
                  isToday={isSameDay(cell.date, today)}
                  tasksForDay={getTasksForDate(cell.date)}
                  onOpenTaskModal={handleOpenTaskModal}
                />
              </article>
            );
          })}
        </section>
          </>
        )}
      </main>

      <NavigationBar
        onCreateClick={() => handleOpenTaskModal(undefined, 'income', today)}
        isVisible={isNavVisible}
      />
      {isTaskModalOpen && (
        <UnifiedTaskFormModal
          isOpen={isTaskModalOpen}
          onClose={handleCloseTaskModal}
          onSubmit={handleSubmitTask}
          onTaskUpsert={handleCloseTaskModal}
          mode={modalTaskMode}
          initialTaskData={currentTaskForModal}
          initialTaskType={initialModalTaskType}
          onDelete={currentTaskForModal?.uuid ? handleDeleteTask : undefined}
          onDuplicate={currentTaskForModal?.uuid ? handleDuplicateTask : undefined}
        />
      )}
    </div>
  );
};

export default WeekView;
