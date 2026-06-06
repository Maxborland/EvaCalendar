import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useNav } from '../context/useNav';
import {
  getTasksForDate as getTasksForDateProjection,
} from '../domain/planningProjection';
import { getTodayUTC } from '../domain/datePeriod';
import { useCreateTaskModal } from '../hooks/useCreateTaskModal';
import { useSwipe } from '../hooks/useSwipe';
import { useTasks, useUpdateTask, useDeleteTask, useDuplicateTask } from '../hooks/useTasks';
import type { Task } from '../services/api';
import {
  addDays,
  addWeeks,
  formatDateRange,
  formatDateToYYYYMMDD,
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

type CreateTaskType = 'income' | 'expense' | 'task' | 'lesson';
type WeekMotionDirection = 'idle' | 'previous' | 'next';

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
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const duplicateTaskMutation = useDuplicateTask();
  const { openCreateModal, createModalElement } = useCreateTaskModal();
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
  const [currentTaskForModal, setCurrentTaskForModal] = useState<Task | undefined>(undefined);
  const [initialModalTaskType, setInitialModalTaskType] = useState<CreateTaskType>('income');
  const [weekMotionDirection, setWeekMotionDirection] = useState<WeekMotionDirection>('idle');


  useEffect(() => {
    if (!isAuthenticated && !isAuthLoading) {
      navigate('/login');
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  useEffect(() => {
    if (!isGlobalModalOpen && !isTaskModalOpen) {
      setIsNavVisible(true);
    }
  }, [setIsNavVisible, isGlobalModalOpen, isTaskModalOpen]);


  const goToPreviousWeek = () => {
    setWeekMotionDirection('previous');
    setCurrentDate(subtractWeeks(currentDate, 1));
  };

  const goToNextWeek = () => {
    setWeekMotionDirection('next');
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

  const todayDateString = useMemo(() => formatDateToYYYYMMDD(today), [today]);

  const weekRangeLabel = weekDays.length === 7 ? formatDateRange(weekDays[0], weekDays[6]) : '';
  const weekAnimationClass = weekMotionDirection === 'idle'
    ? ''
    : weekMotionDirection === 'next'
      ? 'week-motion-next'
      : 'week-motion-previous';
  const isInitialTasksLoading = tasksQuery.isLoading && !tasksQuery.data;
  const hasInitialTasksError = tasksQuery.isError && tasks.length === 0;

  const handleOpenTaskModal = useCallback((taskToEdit?: Task, taskType?: CreateTaskType, defaultDate?: Date | string, createDefaults?: Partial<Task>) => {
    if (taskToEdit) {
      setCurrentTaskForModal(taskToEdit);
      setInitialModalTaskType(taskType || (taskToEdit.type === 'expense' ? 'expense' : taskToEdit.type === 'task' ? 'task' : taskToEdit.type === 'lesson' ? 'lesson' : 'income'));
      setIsTaskModalOpen(true);
      setIsGlobalModalOpen(true);
      setIsNavVisible(false);
      return;
    }

    openCreateModal(taskType || 'income', {
      dueDate: formatDateToYYYYMMDD(defaultDate || today),
      ...createDefaults,
    });
  }, [openCreateModal, today, setIsGlobalModalOpen, setIsNavVisible]);

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

    if (!('uuid' in taskData) || !taskData.uuid) {
      throw new Error('Редактирование задачи требует uuid.');
    }

    const { uuid, ...updateData } = taskData;
    await updateTaskMutation.mutateAsync({ uuid, data: updateData as Partial<Omit<Task, 'uuid'>> });
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
      <TopNavigator title="План недели" showButtons={false} showSettingsButton={true} />
      <main
        id="main-content"
        className="eva-week-shell flex-1 flex flex-col gap-[var(--spacing-sm)] p-[var(--spacing-md)] pb-[calc(178px+env(safe-area-inset-bottom))] min-[480px]:gap-[var(--spacing-md)] min-[480px]:p-[var(--spacing-lg)] min-[480px]:pb-[calc(178px+env(safe-area-inset-bottom))] max-[360px]:p-[var(--spacing-sm)] max-[360px]:pb-[calc(168px+env(safe-area-inset-bottom))]"
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
          ref={gridRef}
          key={weekDays[0]?.toISOString()}
          className={`week-bento-grid ${weekAnimationClass}`}
          onAnimationEnd={() => setWeekMotionDirection('idle')}
          aria-label="План недели"
        >
          {orderedWeekCells.map((cell) => {
            if (cell.type === 'note') {
              const noteWeekId = formatDateToYYYYMMDD(cell.date);
              return (
                <article key={cell.id} className="week-bento-day-tile min-w-0 flex self-stretch [&>*]:flex-1 [&>*]:min-w-0">
                  <NoteField weekId={noteWeekId} />
                </article>
              );
            }

            return (
              <article key={cell.id} className="week-bento-day-tile min-w-0 flex [&>*]:flex-1 [&>*]:min-w-0">
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
        <section className="week-thumb-switcher" aria-label="Переключение недели">
          <button
            type="button"
            className="week-thumb-button"
            onClick={goToPreviousWeek}
            aria-label="Предыдущая неделя"
          >
            <span className="material-icons" aria-hidden="true">chevron_left</span>
          </button>
          <div className="week-thumb-label">
            <span>Неделя</span>
            <strong>{weekRangeLabel}</strong>
          </div>
          <button
            type="button"
            className="week-thumb-button"
            onClick={goToNextWeek}
            aria-label="Следующая неделя"
          >
            <span className="material-icons" aria-hidden="true">chevron_right</span>
          </button>
        </section>
          </>
        )}
      </main>

      <NavigationBar
        onCreateClick={() => openCreateModal('income', { dueDate: todayDateString })}
        isVisible={isNavVisible}
      />
      {isTaskModalOpen && (
        <UnifiedTaskFormModal
          isOpen={isTaskModalOpen}
          onClose={handleCloseTaskModal}
          onSubmit={handleSubmitTask}
          onTaskUpsert={handleCloseTaskModal}
          mode="edit"
          initialTaskData={currentTaskForModal}
          initialTaskType={initialModalTaskType}
          onDelete={currentTaskForModal?.uuid ? handleDeleteTask : undefined}
          onDuplicate={currentTaskForModal?.uuid ? handleDuplicateTask : undefined}
        />
      )}
      {createModalElement}
    </div>
  );
};

export default WeekView;
