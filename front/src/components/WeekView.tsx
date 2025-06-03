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
  isSameDay, // Добавляем недостающий импорт
  startOfISOWeek,
  subtractWeeks
} from '../utils/dateUtils';
import SummaryBlock from './SummaryBlock';
import TopNavigator from './TopNavigator';
// import WeekDaysScroller from './WeekDaysScroller'; // Заменяется на TwoColumnWeekLayout
import NoteField from './NoteField'; // Импортируем NoteField
// import TwoColumnWeekLayout from './TwoColumnWeekLayout'; // Больше не используется напрямую в таком виде
import DayColumn from './DayColumn'; // Импортируем DayColumn напрямую
import UnifiedTaskFormModal from './UnifiedTaskFormModal';
import WeekNavigator from './WeekNavigator';

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
  const [dailySummary, setDailySummary] = useState<{ totalEarned: number, totalSpent: number } | null>(null); // Обновляем тип состояния для дневной сводки
  const [monthlySummary, setMonthlySummary] = useState<{ totalEarned: number; totalSpent: number; balance: number; }>({ totalEarned: 0, totalSpent: 0, balance: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { isNavVisible, setIsNavVisible, isModalOpen: isGlobalModalOpen, setIsModalOpen: setIsGlobalModalOpen } = useNav();

  // Состояния для UnifiedTaskFormModal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalTaskMode, setModalTaskMode] = useState<'create' | 'edit'>('create');
  const [currentTaskForModal, setCurrentTaskForModal] = useState<Task | undefined>(undefined);
  const [initialModalTaskType, setInitialModalTaskType] = useState<'income' | 'expense'>('income');


  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tasks] = await Promise.all([ // Удалена переменная notes
        getAllTasks(),
        // getAllNotes() // Закомментирован вызов getAllNotes, так как notes не используется
      ]);
      setTasksForWeek(tasks);
      // setAllNotes(notes); // Удалено, так как allNotes не используется
    } catch (error) {
      console.error('Error fetching initial data: ', error);
      setTasksForWeek([]);
      // setAllNotes([]); // Удалено, так как allNotes не используется
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // useEffect(() => { // Удалено, так как notesForCurrentWeek не используется
  //   const startOfWeek = currentDate.clone().startOf('isoWeek');
  //   const endOfWeek = currentDate.clone().endOf('isoWeek');
  //
  //   const filteredNotes = allNotes.filter(note => {
  //     const noteDate = moment(note.date);
  //     const isBetween = noteDate.isBetween(startOfWeek, endOfWeek, 'day', '[]');
  //     return isBetween; // '[]' включает начальную и конечную даты
  //   });
  //   setNotesForCurrentWeek(filteredNotes);
  // }, [allNotes, currentDate]);

  const fetchSummary = useCallback(async () => {
    // setIsLoading(true); // Управляется в loadTasksForWeek
    try {
      // Получаем сводку за день для текущего дня (сегодня)
      const dailyDate = createDate(today).toISOString().slice(0, 10);
      const daily = await getDailySummary(dailyDate); // Убедимся, что дата передается в формате YYYY-MM-DD
      if (daily) { // Проверяем, что daily не null
        setDailySummary(daily); // daily теперь { totalEarned: number, totalSpent: number }
      } else {
        // Если daily равно null, устанавливаем null или объект с нулевыми значениями
        setDailySummary(null); // или setDailySummary({ totalEarned: 0, totalSpent: 0 }); в зависимости от логики отображения
      }

      // Получаем сводку за месяц
      const year = getYear(currentDate);
      const month = getMonth(currentDate); // getMonth() из dateUtils возвращает 1-12
      const monthly = await getMonthlySummary(year, month);
      setMonthlySummary(monthly);
    } catch (error) {
      console.error('[WeekView] Error fetching summary:', error);
    } finally {
      // setIsLoading(false); // Управляется в loadTasksForWeek
    }
  }, [currentDate, today]); // Зависимость от currentDate для месячной сводки и today для дневной

  useEffect(() => {
    // fetchSummary вызывается после загрузки задач или при изменении currentDate/today
    // Чтобы избежать двойной загрузки, можно вызывать fetchSummary внутри loadTasksForWeek
    // или когда tasksForWeek обновлены, но для простоты пока оставим так,
    // т.к. setIsLoading управляется в loadTasksForWeek
    if (!isLoading) { // Вызываем только если не идет основная загрузка задач
        fetchSummary();
    } else {
    }
  }, [fetchSummary, isLoading, tasksForWeek]); // Добавлена зависимость от tasksForWeek и isLoading

  // Эффект для отслеживания прокрутки и скрытия/показа навигации
  useEffect(() => {
    const handleScroll = () => {
      if (isGlobalModalOpen || isTaskModalOpen) return; // Если любое модальное окно открыто

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
    // loadTasksForWeek и fetchSummary будут вызваны через useEffect при изменении currentDate
  };

  const goToNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
    // loadInitialData и fetchSummary будут вызваны через useEffect при изменении currentDate
  };

  // Удаляем состояния и логику, связанные с isFirstHalfVisible, firstHalfDays, secondHalfDays
  // const [isFirstHalfVisible, setIsFirstHalfVisible] = useState(true);
  // const firstHalfDays = weekDays.slice(0, 3);
  // const secondHalfDays = [weekDays[3], ...weekDays.slice(4, 7)];

  const handleDataChange = useCallback(() => {
    loadInitialData(); // Перезагружаем все данные (задачи и заметки)
    fetchSummary();     // Обновляем сводку
  }, [loadInitialData, fetchSummary]); // Удалена зависимость от currentDate, т.к. loadInitialData и fetchSummary уже зависят от нее или today

  // Удаляем showFirstHalf и showSecondHalf
  // const showFirstHalf = () => setIsFirstHalfVisible(true);
  // const showSecondHalf = () => setIsFirstHalfVisible(false);

  // Формируем название текущего недельного диапазона для WeekNavigator
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
      setCurrentTaskForModal({ dueDate: createDate(defaultDate || today).toISOString().slice(0, 10) } as Task); // Устанавливаем дату по умолчанию
      setModalTaskMode('create');
      setInitialModalTaskType(taskType || 'income');
    }
    setIsTaskModalOpen(true);
    setIsGlobalModalOpen(true); // Управляем глобальным состоянием модалки
    setIsNavVisible(false);
  }, [today, setIsGlobalModalOpen, setIsNavVisible]);

  const handleCloseTaskModal = useCallback(() => {
    setIsTaskModalOpen(false);
    setCurrentTaskForModal(undefined);
    setIsGlobalModalOpen(false); // Управляем глобальным состоянием модалки
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
      handleDataChange(); // Обновляем данные на странице
      handleCloseTaskModal();
    } catch (error) {
      console.error('Ошибка при сохранении задачи:', error);
      // Можно добавить toast для пользователя
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
          <TopNavigator />
          <main className="flex-grow p-4 space-y-6 pb-20"> {/* Добавлен pb-20 для отступа */}
            <SummaryBlock
                today={today}
                monthlySummary={monthlySummary ? { totalIncome: monthlySummary.totalEarned, totalExpense: monthlySummary.totalSpent, balance: monthlySummary.balance } : { totalIncome: 0, totalExpense: 0, balance: 0 }}
                type="balance"
            />
            {/* Кнопка "Создать задачу" теперь позиционируется абсолютно */}
            <WeekNavigator
              goToPreviousWeek={goToPreviousWeek}
              goToNextWeek={goToNextWeek}
              currentWeekDisplay={weekRangeDisplay}
            />
            {/* Обертка для сетки дней и заметок */}
            <div className="grid grid-cols-2 gap-4">
              {weekDays.length === 7 && (
                <>
                  {/* Ряд 1 */}
                  <DayColumn
                    key={weekDays[0].toISOString()}
                    fullDate={weekDays[0]} // Пн
                    today={today}
                    tasksForDay={tasksForWeek.filter(task => isSameDay(createDate(task.dueDate), weekDays[0]))}
                    onDataChange={handleDataChange}
                    onOpenTaskModal={handleOpenTaskModal}
                  />
                  <DayColumn
                    key={weekDays[3].toISOString()}
                    fullDate={weekDays[3]} // Чт
                    today={today}
                    tasksForDay={tasksForWeek.filter(task => isSameDay(createDate(task.dueDate), weekDays[3]))}
                    onDataChange={handleDataChange}
                    onOpenTaskModal={handleOpenTaskModal}
                  />
                  {/* Ряд 2 */}
                  <DayColumn
                    key={weekDays[1].toISOString()}
                    fullDate={weekDays[1]} // Вт
                    today={today}
                    tasksForDay={tasksForWeek.filter(task => isSameDay(createDate(task.dueDate), weekDays[1]))}
                    onDataChange={handleDataChange}
                    onOpenTaskModal={handleOpenTaskModal}
                  />
                  <DayColumn
                    key={weekDays[4].toISOString()}
                    fullDate={weekDays[4]} // Пт
                    today={today}
                    tasksForDay={tasksForWeek.filter(task => isSameDay(createDate(task.dueDate), weekDays[4]))}
                    onDataChange={handleDataChange}
                    onOpenTaskModal={handleOpenTaskModal}
                  />
                  {/* Ряд 3 */}
                  <DayColumn
                    key={weekDays[2].toISOString()}
                    fullDate={weekDays[2]} // Ср
                    today={today}
                    tasksForDay={tasksForWeek.filter(task => isSameDay(createDate(task.dueDate), weekDays[2]))}
                    onDataChange={handleDataChange}
                    onOpenTaskModal={handleOpenTaskModal}
                  />
                  <DayColumn
                    key={weekDays[5].toISOString()}
                    fullDate={weekDays[5]} // Сб
                    today={today}
                    tasksForDay={tasksForWeek.filter(task => isSameDay(createDate(task.dueDate), weekDays[5]))}
                    onDataChange={handleDataChange}
                    onOpenTaskModal={handleOpenTaskModal}
                  />
                  {/* Ряд 4 */}
                  <div className="col-span-1"> {/* Обертка для NoteField с col-span-1 */}
                    <NoteField
                      weekId={createDate(weekDays[0]).toISOString().slice(0, 10)}
                      onNoteSaved={handleDataChange}
                    />
                  </div>
                  <DayColumn
                    key={weekDays[6].toISOString()}
                    fullDate={weekDays[6]} // Вс
                    today={today}
                    tasksForDay={tasksForWeek.filter(task => isSameDay(createDate(task.dueDate), weekDays[6]))}
                    onDataChange={handleDataChange}
                    onOpenTaskModal={handleOpenTaskModal}
                    // className="col-span-1" // Можно добавить, если нужно явно указать
                  />
                </>
              )}
            </div>
          </main>
          {/* Кнопка "Создать задачу" вынесена из main и позиционируется фиксированно */}
          <button
            className="fixed bottom-5 right-5 bg-button-green text-white py-3 px-4 rounded-full shadow-lg flex items-center justify-center space-x-2 hover:bg-green-600 transition-colors z-50" // Добавлены стили для позиционирования и z-index
            onClick={() => handleOpenTaskModal(undefined, 'income', today)}
          >
            <span className="material-icons">add_circle_outline</span>
            <span>Создать задачу</span>
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