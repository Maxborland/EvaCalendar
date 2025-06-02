import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNav } from '../context/NavContext';
import { getAllTasks, getDailySummary, getMonthlySummary, type Task } from '../services/api';
import {
  addDays,
  addWeeks,
  createDate,
  formatDateRange,
  getCurrentDate,
  getMonth,
  getYear,
  startOfISOWeek,
  subtractWeeks
} from '../utils/dateUtils';
import SummaryBlock from './SummaryBlock';
import TopNavigator from './TopNavigator';
// import WeekDaysScroller from './WeekDaysScroller'; // Заменяется на TwoColumnWeekLayout
import TwoColumnWeekLayout from './TwoColumnWeekLayout'; // Новый компонент
import WeekNavigator from './WeekNavigator';

const WeekView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(getCurrentDate());
  const [tasksForWeek, setTasksForWeek] = useState<Task[]>([]);
  // const [notesForCurrentWeek, setNotesForCurrentWeek] = useState<Note[]>([]); // Удалено, так как не используется
  // const [weekInfo, setWeekInfo] = useState<{ id: string | null; startDate: string; endDate: string }>({ id: null, startDate: '', endDate: '' }); // Удалено
  const [today] = useState(getCurrentDate()); // Состояние для получения текущего дня
  // Используем useMemo для мемоизации дней недели
  const weekDays = useMemo<Date[]>(() => {
    const startOfWeek = startOfISOWeek(currentDate);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(startOfWeek, i));
    }
    return days;
  }, [currentDate]);
  const [dailySummary, setDailySummary] = useState<{ totalEarned: number, totalSpent: number } | null>(null); // Обновляем тип состояния для дневной сводки
  const [monthlySummary, setMonthlySummary] = useState<{ totalEarned: number; totalSpent: number; balance: number; }>({ totalEarned: 0, totalSpent: 0, balance: 0 }); // Добавляем состояние для месячной сводки
  const [isLoading, setIsLoading] = useState(true); // Состояние для отслеживания загрузки
  const { isNavVisible, setIsNavVisible, isModalOpen } = useNav(); // Состояние для видимости навигации из контекста

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
      if (isModalOpen) return; // Если модальное окно открыто, отключаем логику прокрутки

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      // Если прокручена донизу, то скрыть навигацию, иначе показать
      if (scrollTop + clientHeight >= scrollHeight - 20) { // -20 для небольшого отступа снизу
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setIsNavVisible, isModalOpen]);


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

  return (
    <div className="week-view">
      {isLoading ? (
        <div className="loading-indicator">Загрузка данных...</div>
      ) : (
        <>
          <TopNavigator isNavVisible= {isNavVisible} />
          <div className="summary-wrap">
            <SummaryBlock
              today={today}
              dailySummary={dailySummary ? { totalIncome: dailySummary.totalEarned, totalExpense: dailySummary.totalSpent, balance: dailySummary.totalEarned - dailySummary.totalSpent } : { totalIncome: 0, totalExpense: 0, balance: 0 }}
              monthlySummary={monthlySummary ? { totalIncome: monthlySummary.totalEarned, totalExpense: monthlySummary.totalSpent, balance: monthlySummary.balance } : { totalIncome: 0, totalExpense: 0, balance: 0 }}
            />
          </div>
          <TwoColumnWeekLayout
            weekDays={weekDays}
            tasksForWeek={tasksForWeek}
            today={today}
            onDataChange={handleDataChange}
          />
          <WeekNavigator
            goToPreviousWeek={goToPreviousWeek}
            goToNextWeek={goToNextWeek}
            currentWeekDisplay={weekRangeDisplay}
            isNavVisible={isNavVisible}
          />
        </>
      )}
    </div>
  );
};

export default WeekView;