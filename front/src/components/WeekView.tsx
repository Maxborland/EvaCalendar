import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNav } from '../context/NavContext';
import { createTask, deleteTask, duplicateTask, getAllTasks, getDailySummary, getMonthlySummary, updateTask, type Task } from '../services/api';
import {
  addDays,
  addWeeks,
  createDate,
  formatDateRange,
  getCurrentDate,
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
const WeekView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(getCurrentDate());
  const [tasksForWeek, setTasksForWeek] = useState<Task[]>([]);
  const [today] = useState(getCurrentDate());
  const weekDays = useMemo<Date[]>(() => {
    const startOfWeek = startOfISOWeek(currentDate);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(startOfWeek, i));
    }
    return days;
  }, [currentDate]);
  const [isLoading, setIsLoading] = useState(true);
  const { setIsNavVisible, isModalOpen: isGlobalModalOpen, setIsModalOpen: setIsGlobalModalOpen } = useNav();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalTaskMode, setModalTaskMode] = useState<'create' | 'edit'>('create');
  const [currentTaskForModal, setCurrentTaskForModal] = useState<Task | undefined>(undefined);
  const [initialModalTaskType, setInitialModalTaskType] = useState<'income' | 'expense'>('income');


  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tasks] = await Promise.all([
        getAllTasks(),
      ]);
      setTasksForWeek(tasks);
    } catch (error) {
      console.error('Error fetching initial data: ', error);
      setTasksForWeek([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const fetchSummary = useCallback(async () => {
    try {
      const dailyDate = createDate(today).toISOString().slice(0, 10);
      await getDailySummary(dailyDate);

      const year = getYear(currentDate);
      const month = getMonth(currentDate);
      await getMonthlySummary(year, month);
    } catch (error) {
      console.error('[WeekView] Error fetching summary:', error);
    }
  }, [currentDate, today]);

  useEffect(() => {
    if (!isLoading) {
        fetchSummary();
    } else {
    }
  }, [fetchSummary, isLoading, tasksForWeek]);

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

  const handleDataChange = useCallback(() => {
    loadInitialData();
    fetchSummary();
  }, [loadInitialData, fetchSummary]);

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

  const handleSubmitTask = async (taskData: Task | Omit<Task, 'uuid'>) => {
    try {
      if ('uuid' in taskData && taskData.uuid) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { uuid, ...updateData } = taskData;
        await updateTask(taskData.uuid, updateData as Partial<Omit<Task, 'uuid'>>);
      } else {
        await createTask(taskData as Omit<Task, 'uuid'>);
      }
      handleDataChange();
      handleCloseTaskModal();
    } catch (error) {
      console.error('Ошибка при сохранении задачи:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
      handleDataChange();
      handleCloseTaskModal();
    } catch (error) {
      console.error(`Ошибка при удалении задачи:`, error);
    }
  };

  const handleDuplicateTask = async (id: string) => {
    try {
      await duplicateTask(id);
      handleDataChange();
      handleCloseTaskModal();
    } catch (error) {
      console.error(`Ошибка при дублировании задачи:`, error);
    }
  };


  return (
    <div className="min-h-screen flex flex-col">
      {isLoading ? (
        <div className="loading-indicator">Загрузка данных...</div>
      ) : (
        <>
          <TopNavigator title="Zyaka's Calendar" />
          <main className="flex-grow p-4 space-y-6 pb-20">
            <SummaryBlock
                weekStartDate={weekDays.length > 0 ? createDate(weekDays[0]).toISOString().slice(0, 10) : ''}
            />
            <WeekNavigator
              goToPreviousWeek={goToPreviousWeek}
              goToNextWeek={goToNextWeek}
              currentWeekDisplay={weekRangeDisplay}
            />
            <div className="grid grid-cols-2 gap-4">
              {weekDays.length === 7 && (
                <>
                  <DayColumn
                    key={weekDays[0].toISOString()}
                    fullDate={weekDays[0]}
                    today={today}
                    tasksForDay={tasksForWeek.filter(task => isSameDay(createDate(task.dueDate), weekDays[0]))}
                    onDataChange={handleDataChange}
                    onOpenTaskModal={handleOpenTaskModal}
                  />
                  <DayColumn
                    key={weekDays[3].toISOString()}
                    fullDate={weekDays[3]}
                    today={today}
                    tasksForDay={tasksForWeek.filter(task => isSameDay(createDate(task.dueDate), weekDays[3]))}
                    onDataChange={handleDataChange}
                    onOpenTaskModal={handleOpenTaskModal}
                  />
                  <DayColumn
                    key={weekDays[1].toISOString()}
                    fullDate={weekDays[1]}
                    today={today}
                    tasksForDay={tasksForWeek.filter(task => isSameDay(createDate(task.dueDate), weekDays[1]))}
                    onDataChange={handleDataChange}
                    onOpenTaskModal={handleOpenTaskModal}
                  />
                  <DayColumn
                    key={weekDays[4].toISOString()}
                    fullDate={weekDays[4]}
                    today={today}
                    tasksForDay={tasksForWeek.filter(task => isSameDay(createDate(task.dueDate), weekDays[4]))}
                    onDataChange={handleDataChange}
                    onOpenTaskModal={handleOpenTaskModal}
                  />
                  <DayColumn
                    key={weekDays[2].toISOString()}
                    fullDate={weekDays[2]}
                    today={today}
                    tasksForDay={tasksForWeek.filter(task => isSameDay(createDate(task.dueDate), weekDays[2]))}
                    onDataChange={handleDataChange}
                    onOpenTaskModal={handleOpenTaskModal}
                  />
                  <DayColumn
                    key={weekDays[5].toISOString()}
                    fullDate={weekDays[5]}
                    today={today}
                    tasksForDay={tasksForWeek.filter(task => isSameDay(createDate(task.dueDate), weekDays[5]))}
                    onDataChange={handleDataChange}
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
                    tasksForDay={tasksForWeek.filter(task => isSameDay(createDate(task.dueDate), weekDays[6]))}
                    onDataChange={handleDataChange}
                    onOpenTaskModal={handleOpenTaskModal}
                  />
                </>
              )}
            </div>
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
              mode={modalTaskMode}
              initialTaskData={currentTaskForModal}
              initialTaskType={initialModalTaskType}
              onDelete={currentTaskForModal?.uuid ? handleDeleteTask : undefined}
              onDuplicate={currentTaskForModal?.uuid ? handleDuplicateTask : undefined}
            />
          )}
        </>
      )}
    </div>
  );
};

export default WeekView;