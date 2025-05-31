import type { Moment } from 'moment';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNav } from '../context/NavContext';
import { getAllTasks, getDailySummary, getMonthlySummary, type SummaryData, type Task } from '../services/api';
import SummaryBlock from './SummaryBlock';
import TopNavigator from './TopNavigator';
import WeekDaysScroller from './WeekDaysScroller';
import WeekNavigator from './WeekNavigator';

const WeekView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(moment());
  const [tasksForWeek, setTasksForWeek] = useState<Task[]>([]);
  // const [weekInfo, setWeekInfo] = useState<{ id: string | null; startDate: string; endDate: string }>({ id: null, startDate: '', endDate: '' }); // Удалено
  const [today] = useState(moment()); // Состояние для получения текущего дня
  // Используем useMemo для мемоизации дней недели
  const weekDays = useMemo<Moment[]>(() => {
    const startOfWeek = currentDate.clone().startOf('isoWeek');
    const days: Moment[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(startOfWeek.clone().add(i, 'days'));
    }
    return days;
  }, [currentDate]);
  const [dailySummary, setDailySummary] = useState<{ totalEarned: number, totalSpent: number } | null>(null); // Обновляем тип состояния для дневной сводки
  const [monthlySummary, setMonthlySummary] = useState<SummaryData>({ totalIncome: 0, totalExpense: 0, balance: 0 }); // Добавляем состояние для месячной сводки
  const [isLoading, setIsLoading] = useState(true); // Состояние для отслеживания загрузки
  const { isNavVisible, setIsNavVisible, isModalOpen } = useNav(); // Состояние для видимости навигации из контекста

  const loadTasksForWeek = useCallback(async () => {
    setIsLoading(true);
    try {
      // const startOfWeek = currentDate.clone().startOf('isoWeek').format('YYYY-MM-DD'); // Больше не нужно
      // const endOfWeek = currentDate.clone().endOf('isoWeek').format('YYYY-MM-DD'); // Больше не нужно
      const tasks = await getAllTasks(); // Загружаем все задачи
      setTasksForWeek(tasks);
    } catch (error) {
      console.error('Error fetching all tasks: ', error); // Обновленное сообщение об ошибке
      setTasksForWeek([]); // В случае ошибки сбрасываем задачи
    } finally {
      setIsLoading(false);
    }
  }, []); // Зависимость от currentDate удалена, так как загружаем все задачи

  useEffect(() => {
    loadTasksForWeek();
  }, [loadTasksForWeek]);

  const fetchSummary = useCallback(async () => {
    // setIsLoading(true); // Управляется в loadTasksForWeek
    try {
      // Получаем сводку за день для текущего дня (сегодня)
      // Это может потребовать уточнения, если нужна сводка для каждого дня недели отдельно
      // Пока оставим для "сегодня"
      const daily = await getDailySummary(today.format('YYYY-MM-DD')); // Убедимся, что дата передается в формате YYYY-MM-DD
      if (daily) { // Проверяем, что daily не null
        setDailySummary(daily); // daily теперь { totalEarned: number, totalSpent: number }
      } else {
        // Если daily равно null, устанавливаем null или объект с нулевыми значениями
        setDailySummary(null); // или setDailySummary({ totalEarned: 0, totalSpent: 0 }); в зависимости от логики отображения
      }

      // Получаем сводку за месяц
      const monthly = await getMonthlySummary(currentDate.year(), currentDate.month() + 1); // moment.month() возвращает 0-11
      setMonthlySummary(monthly);
    } catch (error) {
      console.error('Error fetching summary:', error);
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
    setCurrentDate(currentDate.clone().subtract(1, 'week'));
    // loadTasksForWeek и fetchSummary будут вызваны через useEffect при изменении currentDate
  };

  const goToNextWeek = () => {
    setCurrentDate(currentDate.clone().add(1, 'week'));
    // loadTasksForWeek и fetchSummary будут вызваны через useEffect при изменении currentDate
  };

  const [isFirstHalfVisible, setIsFirstHalfVisible] = useState(true);

  const firstHalfDays = weekDays.slice(0, 3);
  const secondHalfDays = [weekDays[3], ...weekDays.slice(4, 7)];

  const handleTaskChange = useCallback(() => { // Переименовано для общности (move, add, update)
    loadTasksForWeek(); // Перезагружаем задачи на неделю
    fetchSummary();     // Обновляем сводку
  }, [loadTasksForWeek, fetchSummary]);

  const showFirstHalf = () => setIsFirstHalfVisible(true);
  const showSecondHalf = () => setIsFirstHalfVisible(false);

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
              monthlySummary={monthlySummary} // Передаем monthlySummary
            />
          </div>
          <WeekDaysScroller
            tasksForWeek={tasksForWeek}
            firstHalfDays={firstHalfDays}
            secondHalfDays={secondHalfDays}
            today={today}
            onTaskMove={handleTaskChange} // Используем новый обработчик
            isFirstHalfVisible={isFirstHalfVisible}
          />
          <WeekNavigator
            goToPreviousWeek={goToPreviousWeek}
            goToNextWeek={goToNextWeek}
            showFirstHalf={showFirstHalf}
            showSecondHalf={showSecondHalf}
            isNavVisible={isNavVisible} // Передаем состояние видимости навигации
          />
        </>
      )}
    </div>
  );
};

export default WeekView;