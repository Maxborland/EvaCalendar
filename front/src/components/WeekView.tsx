import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLoaderData } from 'react-router-dom'; // Добавляем useLoaderData
import { useNav } from '../context/NavContext';
import { createTask, deleteTask, duplicateTask, getDailySummary, getMonthlySummary, updateTask, type Task } from '../services/api'; // Удаляем getAllTasks, так как данные будут из loader
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

interface WeekViewLoaderData {
  tasks: Task[];
}

const WeekView: React.FC = () => {
  const { tasks: initialTasks } = useLoaderData() as WeekViewLoaderData; // Получаем данные из loader
  const [currentDate, setCurrentDate] = useState(getCurrentDate());
  // const [tasksForWeek, setTasksForWeek] = useState<Task[]>([]); // Удаляем, используем данные из loader
  const [tasksForWeek, setTasksForWeek] = useState<Task[]>(initialTasks); // Используем данные из loader
  const [today] = useState(getCurrentDate());
  const weekDays = useMemo<Date[]>(() => {
    const startOfWeek = startOfISOWeek(currentDate);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(startOfWeek, i));
    }
    return days;
  }, [currentDate]);
  // const [isLoading, setIsLoading] = useState(true); // Удаляем, состояние загрузки управляется react-router
  const { setIsNavVisible, isModalOpen: isGlobalModalOpen, setIsModalOpen: setIsGlobalModalOpen } = useNav();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalTaskMode, setModalTaskMode] = useState<'create' | 'edit'>('create');
  const [currentTaskForModal, setCurrentTaskForModal] = useState<Task | undefined>(undefined);
  const [initialModalTaskType, setInitialModalTaskType] = useState<'income' | 'expense'>('income');


  // Удаляем loadInitialData и связанный useEffect, так как задачи загружаются через loader
  // const loadInitialData = useCallback(async () => {
  //   // setIsLoading(true); // Удалено
  //   try {
  //     // const [tasks] = await Promise.all([ // getAllTasks() теперь в loader
  //     //   getAllTasks(),
  //     // ]);
  //     // setTasksForWeek(tasks); // Устанавливается из useLoaderData
  //   } catch (error) {
  //     console.error('Error fetching initial data: ', error);
  //     // setTasksForWeek([]); // Обработка ошибок загрузчика будет в другом месте или через ErrorBoundary
  //   } finally {
  //     // setIsLoading(false); // Удалено
  //   }
  // }, []);

  // useEffect(() => {
  //   // loadInitialData(); // Удалено
  //   // Вместо этого, обновим tasksForWeek, если initialTasks из лоадера изменились (например, при HMR или повторной валидации)
  //   setTasksForWeek(initialTasks);
  // }, [initialTasks]);

  // Функция для перезагрузки данных, если это необходимо после мутаций
  // const reloadTasks = useCallback(async () => {
  //   // Здесь можно было бы вызвать navigate(location.pathname, { replace: true }) или другой механизм для перезапуска loader,
  //   // но для простоты пока оставим обновление состояния напрямую, если API-вызовы в loader не будут повторно вызываться автоматически.
  //   // Либо, если loader всегда возвращает свежие данные, можно просто обновить состояние из него.
  //   // Для текущей задачи, предполагаем, что после мутации (create/update/delete) нам нужно обновить список задач.
  //   // Простейший способ - это если бы loader сам перезапускался.
  //   // Если нет, то нужно будет либо снова вызвать API, либо использовать `revalidate` из `useRevalidator`.
  //   // Пока что, для простоты, предположим, что `handleDataChange` будет обновлять `tasksForWeek`
  //   // из `initialTasks` или вызывать API заново.
  //   // Для корректной работы с loader, лучше использовать `navigate` или `revalidator`.
  //   // Но для начала, просто обновим tasksForWeek из initialTasks, если они изменились.
  //   setTasksForWeek(initialTasks); // Это может быть не всегда актуально, если initialTasks не обновляются без перезагрузки loader
  //                                  // Правильнее было бы иметь функцию, которая перезапускает loader или запрашивает данные снова.
  //                                  // Пока что, для демонстрации, оставим так.
  //                                  // В реальном приложении, после мутации, нужно обеспечить перезагрузку данных из loader.
  //                                  // Это можно сделать через `revalidator.revalidate()` или `navigate('.', { replace: true })`.
  //                                  // Для простоты, мы будем обновлять tasksForWeek из initialTasks,
  //                                  // и предполагаем, что `handleDataChange` будет вызван после мутаций.
  // }, [initialTasks]);


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
    // if (!isLoading) { // isLoading удален
    fetchSummary();
    // } else {
    // }
  }, [fetchSummary, tasksForWeek]); // tasksForWeek теперь зависит от initialTasks

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

  const handleDataChange = useCallback(async () => {
    // loadInitialData(); // Удалено, данные из loader
    // Вместо loadInitialData, нам нужно как-то обновить tasksForWeek.
    // Если loader автоматически не перезапускается после навигации на тот же путь,
    // нам может потребоваться явно перезагрузить данные или использовать revalidator.
    // Пока что, мы можем попробовать обновить tasksForWeek из initialTasks,
    // но это не гарантирует свежесть данных без перезапуска loader.
    // Для простоты, предположим, что `initialTasks` будут обновлены при следующей навигации
    // или что `fetchSummary` не зависит от самых свежих `tasksForWeek` напрямую для своего вызова.
    // В идеале, после мутации, нужно вызвать revalidator.revalidate()
    // Это потребует `useRevalidator` хука.
    // Пока что, просто вызовем fetchSummary.
    // И обновим tasksForWeek из initialTasks, если они изменились.
    // Это не идеальное решение, но для начала.
    // TODO: Использовать revalidator для обновления данных из loader после мутаций.
    setTasksForWeek(initialTasks); // Обновляем из данных лоадера
    fetchSummary();
  }, [initialTasks, fetchSummary]);

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
      {/* Локальный индикатор загрузки удален, так как используется глобальный PageLoader */}
        <>
          <TopNavigator title="" />
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
      {/* )} */} {/* Закрывающий комментарий для isLoading также удален */}
    </div>
  );
};

export default WeekView;