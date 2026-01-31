import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavContext';
import { useSwipe } from '../hooks/useSwipe';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useDuplicateTask } from '../hooks/useTasks';
import type { Task } from '../services/api';
import {
  addDays,
  addWeeks,
  createDate,
  isSameDay,
  startOfISOWeek,
  subtractWeeks
} from '../utils/dateUtils';
import DayColumn from './DayColumn';
import NoteField from './NoteField';
import TopNavigator from './TopNavigator';
import UnifiedTaskFormModal from './UnifiedTaskFormModal';
import NavigationBar from './NavigationBar';

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
  const { isNavVisible, setIsNavVisible, isModalOpen: isGlobalModalOpen, setIsModalOpen: setIsGlobalModalOpen } = useNav();
  const gridRef = useRef<HTMLElement>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalTaskMode, setModalTaskMode] = useState<'create' | 'edit'>('create');
  const [currentTaskForModal, setCurrentTaskForModal] = useState<Task | undefined>(undefined);
  const [initialModalTaskType, setInitialModalTaskType] = useState<'income' | 'expense'>('income');


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
    <div className="min-h-dvh flex flex-col bg-surface-app">
      <TopNavigator title="Zyaka's Calendar" />
      <main
        id="main-content"
        className="flex-1 flex flex-col gap-[var(--spacing-md)] p-[var(--spacing-md)] pb-[calc(80px+env(safe-area-inset-bottom))] min-[480px]:gap-[var(--spacing-lg)] min-[480px]:p-[var(--spacing-lg)] min-[480px]:pb-0 max-[360px]:gap-[var(--spacing-sm)] max-[360px]:p-[var(--spacing-sm)] max-[360px]:pb-0"
      >
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
      </main>

      <NavigationBar
        goToPreviousWeek={goToPreviousWeek}
        goToNextWeek={goToNextWeek}
        onSummaryClick={() => navigate('/statistics')}
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
