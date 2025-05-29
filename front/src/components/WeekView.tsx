import type { Moment } from 'moment';
import moment from 'moment';
import React, { useCallback, useEffect, useState } from 'react';
import { getDailySummary, getWeeklySummary } from '../services/api';
import FirstHalfOfWeek from './FirstHalfOfWeek';
import SecondHalfOfWeek from './SecondHalfOfWeek';

const WeekView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(moment());
  const [weekInfo, setWeekInfo] = useState<{ id: string | null; startDate: string; endDate: string }>({ id: null, startDate: '', endDate: '' });
  const [today] = useState(moment()); // Состояние для получения текущего дня
  const [weekDays, setWeekDays] = useState<Moment[]>([]); // Добавляем состояние для дней недели
  const [dailySummary, setDailySummary] = useState({ totalIncome: 0, totalExpense: 0 }); // Добавляем состояние для дневной сводки
  const [weeklySummary, setWeeklySummary] = useState({ totalIncome: 0, totalExpense: 0 }); // Добавляем состояние для недельной сводки

  const fetchWeekInfo = useCallback(async () => {
    try {
      const formattedDate = currentDate.format('YYYY-MM-DD');
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
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
    }
  }, [currentDate]);

  useEffect(() => {
    fetchWeekInfo();
  }, [fetchWeekInfo]);

  const fetchSummary = useCallback(async () => {
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
  }, [weekInfo, today]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    const startOfWeek = currentDate.clone().startOf('isoWeek');
    const days: Moment[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(startOfWeek.clone().add(i, 'days'));
    }
    setWeekDays(days);

  }, [currentDate, today]);

  const goToPreviousWeek = () => {
    setCurrentDate(currentDate.clone().subtract(1, 'week'));
  };

  const goToNextWeek = () => {
    setCurrentDate(currentDate.clone().add(1, 'week'));
  };

  const firstHalfDays = weekDays.slice(0, 3);
  const secondHalfDays = [weekDays[3], ...weekDays.slice(4, 7)];

  return (
    <div className="week-view">
      <div className="navigation-buttons">
        <button onClick={goToPreviousWeek}>Предыдущая неделя</button>
        <button onClick={goToNextWeek}>Следующая неделя</button>
      </div>
      <h2 style={{ padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px', textAlign: 'center' }}>
        <p>Сегодня: {today.format('D MMMM YYYY')}</p>
        <p>Заработано сегодня: {dailySummary.totalIncome.toFixed(2)}₽ | Потрачено сегодня: {dailySummary.totalExpense.toFixed(2)}₽</p>
        <p>Заработано за неделю: {weeklySummary.totalIncome.toFixed(2)}₽ | Потрачено за неделю: {weeklySummary.totalExpense.toFixed(2)}₽</p>
        <p>Неделя: {moment(weekInfo.startDate).format('D MMMM YY')} - {moment(weekInfo.endDate).format('D MMMM YY')}</p>
      </h2>
      <div className="week-days-container">
        {weekInfo.id !== null && <FirstHalfOfWeek days={firstHalfDays} weekId={weekInfo.id} today={today} onTaskMove={fetchWeekInfo} />}
        {weekInfo.id !== null && <SecondHalfOfWeek days={secondHalfDays} weekId={weekInfo.id} today={today} onTaskMove={fetchWeekInfo} />}
      </div>
    </div>
  );
};

export default WeekView;