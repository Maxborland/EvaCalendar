import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Добавляем useAuth
import { useNav } from '../context/NavContext';
import { useTasks } from '../context/TaskContext';
import { createTask, deleteTask, duplicateTask, getDailySummary, getMonthlySummary, updateTask, type Task } from '../services/api';
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
import SummaryBlock from './SummaryBlock';
import TopNavigator from './TopNavigator';
import UnifiedTaskFormModal from './UnifiedTaskFormModal';
import WeekNavigator from './WeekNavigator';

import './WeekView.css';

const WeekView = () => {
  const { tasks, refetchTasks } = useTasks();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth(); // Получаем состояние аутентификации
  const navigate = useNavigate(); // Для возможного редиректа
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


  const weekRangeDisplay = useMemo(() => {
    if (weekDays && weekDays.length === 7) {
      return formatDateRange(weekDays[0], weekDays[6]);
    }
    return '';
  }, [weekDays]);

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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { uuid, ...updateData } = taskData;
        await updateTask(taskData.uuid, updateData as Partial<Omit<Task, 'uuid'>>);
      } else {
        await createTask(taskData as Omit<Task, 'uuid'>);
      }
    } catch (error) {
      // Ошибка при сохранении задачи
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
      await deleteTask(id);
      refetchTasks();
      handleCloseTaskModal();
    } catch (error) {
      // Ошибка при удалении задачи
    }
  };

  const handleDuplicateTask = async (id:string) => {
    if (!isAuthenticated && !isAuthLoading) {
      navigate('/login');
      return;
    }
    if (isAuthLoading) return;

    try {
      await duplicateTask(id);
      refetchTasks();
      handleCloseTaskModal();
    } catch (error) {
      // Ошибка при дублировании задачи
    }
  };


  return (
    <div className="min-h-screen flex flex-col">
        <>
          <TopNavigator title="Zyaka's Calendar" />
          <main className="flex-grow p-4 space-y-6 pb-20">
            <SummaryBlock
                weekStartDate={weekDays.length > 0 ? createDate(weekDays[0]).toISOString().slice(0, 10) : ''}
            />
            {/* WeekNavigator moved below days */}
            <div className="grid grid-cols-2 gap-4">
              {weekDays.length === 7 && (
                <>
                  <DayColumn
                    key={weekDays[0].toISOString()}
                    fullDate={weekDays[0]}
                    today={today}
                    isToday={isSameDay(weekDays[0], today)}
                    tasksForDay={tasks.filter(task => isSameDay(createDate(task.dueDate), weekDays[0]))}
                    onOpenTaskModal={handleOpenTaskModal}
                  />
                  <DayColumn
                    key={weekDays[3].toISOString()}
                    fullDate={weekDays[3]}
                    today={today}
                    isToday={isSameDay(weekDays[3], today)}
                    tasksForDay={tasks.filter(task => isSameDay(createDate(task.dueDate), weekDays[3]))}
                    onOpenTaskModal={handleOpenTaskModal}
                  />
                  <DayColumn
                    key={weekDays[1].toISOString()}
                    fullDate={weekDays[1]}
                    today={today}
                    isToday={isSameDay(weekDays[1], today)}
                    tasksForDay={tasks.filter(task => isSameDay(createDate(task.dueDate), weekDays[1]))}
                    onOpenTaskModal={handleOpenTaskModal}
                  />
                  <DayColumn
                    key={weekDays[4].toISOString()}
                    fullDate={weekDays[4]}
                    today={today}
                    isToday={isSameDay(weekDays[4], today)}
                    tasksForDay={tasks.filter(task => isSameDay(createDate(task.dueDate), weekDays[4]))}
                    onOpenTaskModal={handleOpenTaskModal}
                  />
                  <DayColumn
                    key={weekDays[2].toISOString()}
                    fullDate={weekDays[2]}
                    today={today}
                    isToday={isSameDay(weekDays[2], today)}
                    tasksForDay={tasks.filter(task => isSameDay(createDate(task.dueDate), weekDays[2]))}
                    onOpenTaskModal={handleOpenTaskModal}
                  />
                  <DayColumn
                    key={weekDays[5].toISOString()}
                    fullDate={weekDays[5]}
                    today={today}
                    isToday={isSameDay(weekDays[5], today)}
                    tasksForDay={tasks.filter(task => isSameDay(createDate(task.dueDate), weekDays[5]))}
                    onOpenTaskModal={handleOpenTaskModal}
                  />
                  <div className="col-span-1">
                    <NoteField
                      weekId={createDate(weekDays[0]).toISOString().slice(0, 10)}
                    />
                  </div>
                  <DayColumn
                    key={weekDays[6].toISOString()}
                    fullDate={weekDays[6]}
                    today={today}
                    isToday={isSameDay(weekDays[6], today)}
                    tasksForDay={tasks.filter(task => isSameDay(createDate(task.dueDate), weekDays[6]))}
                    onOpenTaskModal={handleOpenTaskModal}
                  />
                </>
              )}
            </div>
            <WeekNavigator
              goToPreviousWeek={goToPreviousWeek}
              goToNextWeek={goToNextWeek}
              currentWeekDisplay={weekRangeDisplay}
            />
          </main>
          <button
            className="fixed bottom-5 right-5 bg-button-green text-white py-3 px-4 rounded-full shadow-lg flex items-center justify-center space-x-2 hover:bg-green-600 transition-colors z-50"
            onClick={() => handleOpenTaskModal(undefined, 'income', today)}
          >
            <span className="material-icons">add_circle_outline</span>
            <span>Создать дело</span>
          </button>
          {isTaskModalOpen && (
            <UnifiedTaskFormModal
              isOpen={isTaskModalOpen}
              onClose={handleCloseTaskModal}
              onSubmit={handleSubmitTask}
              onTaskUpsert={() => {
                refetchTasks();
                handleCloseTaskModal();
              }}
              mode={modalTaskMode}
              initialTaskData={currentTaskForModal}
              initialTaskType={initialModalTaskType}
              onDelete={currentTaskForModal?.uuid ? handleDeleteTask : undefined}
              onDuplicate={currentTaskForModal?.uuid ? handleDuplicateTask : undefined}
            />
          )}
        </>
    </div>
  );
};

export default WeekView;