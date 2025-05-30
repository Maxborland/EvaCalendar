import type { Moment } from 'moment';
import moment from 'moment';
import React, { useCallback, useEffect, useState } from 'react';
import { useNav } from '../context/NavContext';
import { getDailySummary, getWeeklySummary } from '../services/api';
import SummaryBlock from './SummaryBlock';
import WeekDaysScroller from './WeekDaysScroller';
import WeekNavigator from './WeekNavigator';

const WeekView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(moment());
  const [weekInfo, setWeekInfo] = useState<{ id: string | null; startDate: string; endDate: string }>({ id: null, startDate: '', endDate: '' });
  const [today] = useState(moment()); // Состояние для получения текущего дня
  const [weekDays, setWeekDays] = useState<Moment[]>([]); // Добавляем состояние для дней недели
  const [dailySummary, setDailySummary] = useState({ totalIncome: 0, totalExpense: 0 }); // Добавляем состояние для дневной сводки
  const [weeklySummary, setWeeklySummary] = useState({ totalIncome: 0, totalExpense: 0 }); // Добавляем состояние для недельной сводки
  const [isLoading, setIsLoading] = useState(true); // Состояние для отслеживания загрузки
  const { isNavVisible, setIsNavVisible, isModalOpen } = useNav(); // Состояние для видимости навигации из контекста

  const fetchWeekInfo = useCallback(async () => {
    setIsLoading(true); // Начинаем загрузку
    try {
      const formattedDate = currentDate.format('YYYY-MM-DD');
      const baseUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${baseUrl}/weeks?date=${formattedDate}`);

      if (response.status === 404) {
        const newWeekResponse = await fetch(`${baseUrl}/weeks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate: currentDate.clone().startOf('isoWeek').format('YYYY-MM-DD'),
            endDate: currentDate.clone().endOf('isoWeek').format('YYYY-MM-DD'),
          }),
        });
        if (newWeekResponse.ok) {
          const newWeekData = await newWeekResponse.json();
          setWeekInfo({ id: String(newWeekData.id), startDate: newWeekData.startDate, endDate: newWeekData.endDate });
        } else {
          console.error('Failed to create or retrieve week:', newWeekResponse.statusText);
        }
      } else if (response.ok) {
        const data = await response.json();
        setWeekInfo({ id: String(data.id), startDate: data.startDate, endDate: data.endDate });
      } else {
        console.error('Failed to fetch week info:', response.statusText);
      }
    } catch (error) {
           console.error('Error fetching or creating week info: ', error);
     } finally {
        setIsLoading(false); // Заканчиваем загрузку вне зависимости от результата
    }
  }, [currentDate]);

  useEffect(() => {
    fetchWeekInfo();
  }, [fetchWeekInfo]);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true); // Начинаем загрузку
    try {
      if (weekInfo.id) {
        const dayOfWeekNumber = today.isoWeekday(); // День недели по ISO (1-7), как и ожидает summaryController

        // Получаем сводку за день
        // weekInfo.id это UUID недели, который ожидает API
        const daily = await getDailySummary(weekInfo.id, dayOfWeekNumber.toString());
        setDailySummary(daily);

        // Получаем сводку за неделю
        const weekly = await getWeeklySummary(weekInfo.id);
        setWeeklySummary(weekly);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setIsLoading(false); // Заканчиваем загрузку
    }
  }, [weekInfo, today]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

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

  useEffect(() => {
    const startOfWeek = currentDate.clone().startOf('isoWeek');
    const days: Moment[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(startOfWeek.clone().add(i, 'days'));
    }
    setWeekDays(days);
  }, [currentDate]);

  const goToPreviousWeek = () => {
    setCurrentDate(currentDate.clone().subtract(1, 'week'));
    fetchWeekInfo();
    fetchSummary();
  };

  const goToNextWeek = () => {
    setCurrentDate(currentDate.clone().add(1, 'week'));
    fetchWeekInfo();
    fetchSummary();
  };

  const [isFirstHalfVisible, setIsFirstHalfVisible] = useState(true);

  const firstHalfDays = weekDays.slice(0, 3);
  const secondHalfDays = [weekDays[3], ...weekDays.slice(4, 7)];

  const handleTaskMove = useCallback(() => {
    fetchWeekInfo();
    fetchSummary();
  }, [fetchWeekInfo, fetchSummary]);

  const showFirstHalf = () => setIsFirstHalfVisible(true);
  const showSecondHalf = () => setIsFirstHalfVisible(false);

  return (
    <div className="week-view">
      {isLoading ? (
        <div className="loading-indicator">Загрузка данных...</div>
      ) : (
        <>
          <div className="summary-wrap">
            <SummaryBlock
              today={today}
              dailySummary={dailySummary}
              weeklySummary={weeklySummary}
              weekInfo={weekInfo}
            />
          </div>
          <WeekDaysScroller
            weekInfo={weekInfo}
            firstHalfDays={firstHalfDays}
            secondHalfDays={secondHalfDays}
            today={today}
            onTaskMove={handleTaskMove}
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