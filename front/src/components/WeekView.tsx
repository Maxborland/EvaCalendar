import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavContext';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useDuplicateTask } from '../hooks/useTasks';
import { getDailySummary, getMonthlySummary, type Task } from '../services/api';
import {
  addDays,
  addWeeks,
  createDate,
  formatDateRange,
  getMonth,
  getYear,
  isSameDay,
  startOfISOWeek,
  subtractWeeks
} from '../utils/dateUtils';
import DayColumn from './DayColumn';
import NoteField from './NoteField';
import SummaryModal from './SummaryModal';
import TopNavigator from './TopNavigator';
import UnifiedTaskFormModal from './UnifiedTaskFormModal';
import WeekNavigator from './WeekNavigator';

import './WeekView.css';

const WeekView = () => {
  const { data: tasks = [] } = useTasks();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

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
  const { setIsNavVisible, isModalOpen: isGlobalModalOpen, setIsModalOpen: setIsGlobalModalOpen } = useNav();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [modalTaskMode, setModalTaskMode] = useState<'create' | 'edit'>('create');
  const [currentTaskForModal, setCurrentTaskForModal] = useState<Task | undefined>(undefined);
  const [initialModalTaskType, setInitialModalTaskType] = useState<'income' | 'expense'>('income');


  const fetchSummary = useCallback(async () => {
    if (!isAuthenticated && !isAuthLoading) {
      // Пользователь не аутентифицирован и загрузка завершена, не выполняем запрос
      // Можно добавить логику перенаправления или уведомления
      navigate('/login');
      return;
    }
    if (isAuthLoading) {
      // Еще идет проверка аутентификации, подождем
      return;
    }
    try {
      const dailyDate = createDate(today).toISOString().slice(0, 10);
      await getDailySummary(dailyDate);

      const year = getYear(currentDate);
      const month = getMonth(currentDate);
      await getMonthlySummary(year, month);
    } catch (error) {
      // [WeekView] Error fetching summary
    }
  }, [isAuthenticated, isAuthLoading, currentDate, today]);

  useEffect(() => {
    if (!isAuthenticated && !isAuthLoading) {
      navigate('/login');
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary, tasks]);

  useEffect(() => {
    const handleScroll = () => {
      if (isGlobalModalOpen || isTaskModalOpen || isSummaryModalOpen) return;

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setIsNavVisible, isGlobalModalOpen, isTaskModalOpen, isSummaryModalOpen]);


  const goToPreviousWeek = () => {
    setCurrentDate(subtractWeeks(currentDate, 1));
  };

  const goToNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };


  const weekRangeDisplay = useMemo(() => {
    if (weekDays && weekDays.length === 7) {
      return formatDateRange(weekDays[0], weekDays[6]);
    }
    return '';
  }, [weekDays]);

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
      tasks.filter(task => isSameDay(createDate(task.dueDate), targetDate)),
    [tasks]
  );

  const handleOpenTaskModal = useCallback((taskToEdit?: Task, taskType?: 'income' | 'expense', defaultDate?: Date) => {
    if (taskToEdit) {
      setCurrentTaskForModal(taskToEdit);
      setModalTaskMode('edit');
      setInitialModalTaskType(taskType || (taskToEdit.type === 'expense' ? 'expense' : 'income'));
    } else {
      setCurrentTaskForModal({ dueDate: createDate(defaultDate || today).toISOString().slice(0, 10) } as Task);
      setModalTaskMode('create');
      setInitialModalTaskType(taskType || 'income');
    }
    setIsTaskModalOpen(true);
    setIsGlobalModalOpen(true);
    setIsNavVisible(false);
  }, [today, setIsGlobalModalOpen, setIsNavVisible]);

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

    try {
      if ('uuid' in taskData && taskData.uuid) {
        const { uuid, ...updateData } = taskData;
        await updateTaskMutation.mutateAsync({ uuid: taskData.uuid, data: updateData as Partial<Omit<Task, 'uuid'>> });
      } else {
        await createTaskMutation.mutateAsync(taskData as Omit<Task, 'uuid'>);
      }
    } catch (error) {
      throw error;
    }
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
    } catch (error) {
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
    } catch (error) {
      // Ошибка обрабатывается в мутации
    }
  };


  return (
    <div className="week-view">
      <TopNavigator title="Zyaka's Calendar" />
      <main className="week-view__content">
        <section className="week-view__grid" aria-label="План недели">
          {orderedWeekCells.map((cell) => {
            if (cell.type === 'note') {
              const noteWeekId = createDate(cell.date).toISOString().slice(0, 10);
              return (
                <article key={cell.id} className="week-view__cell week-view__cell--note">
                  <NoteField weekId={noteWeekId} />
                </article>
              );
            }

            return (
              <article key={cell.id} className="week-view__cell">
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

        <footer className="week-view__footer">
          <WeekNavigator
            goToPreviousWeek={goToPreviousWeek}
            goToNextWeek={goToNextWeek}
            currentWeekDisplay={weekRangeDisplay}
          />
        </footer>
      </main>

      <button
        type="button"
        className="week-view__fab week-view__fab--summary"
        onClick={() => {
          setIsSummaryModalOpen(true);
          setIsGlobalModalOpen(true);
        }}
        aria-label="Сводка"
      >
        <span className="material-icons week-view__fab-icon">analytics</span>
        <span className="week-view__fab-label">Сводка</span>
      </button>

      <button
        type="button"
        className="week-view__fab week-view__fab--create"
        onClick={() => handleOpenTaskModal(undefined, 'income', today)}
      >
        <span className="material-icons week-view__fab-icon">add_circle_outline</span>
        <span className="week-view__fab-label">Создать дело</span>
      </button>
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
      {isSummaryModalOpen && (
        <SummaryModal
          isOpen={isSummaryModalOpen}
          onClose={() => {
            setIsSummaryModalOpen(false);
            setIsGlobalModalOpen(false);
          }}
          weekStartDate={weekDays.length > 0 ? createDate(weekDays[0]).toISOString().slice(0, 10) : ''}
        />
      )}
    </div>
  );
};

export default WeekView;