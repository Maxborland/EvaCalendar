import type { Moment } from 'moment';
import moment from 'moment';
import React, { useCallback, useEffect, useState } from 'react';
import FirstHalfOfWeek from './FirstHalfOfWeek';
import SecondHalfOfWeek from './SecondHalfOfWeek';

const WeekView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(moment());
  const [weekInfo, setWeekInfo] = useState<{ id: string | null; startDate: string; endDate: string }>({ id: null, startDate: '', endDate: '' });
  const [displayFirstHalf, setDisplayFirstHalf] = useState(true);
  const [today] = useState(moment()); // Состояние для получения текущего дня
  const [weekDays, setWeekDays] = useState<Moment[]>([]); // Добавляем состояние для дней недели

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

  useEffect(() => {
    const startOfWeek = currentDate.clone().startOf('isoWeek');
    const days: Moment[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(startOfWeek.clone().add(i, 'days'));
    }
    setWeekDays(days);

    const currentDayOfWeek = today.isoWeekday();
    if (currentDayOfWeek >= 1 && currentDayOfWeek <= 3) {
      setDisplayFirstHalf(true);
    } else {
      setDisplayFirstHalf(false);
    }
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
      <h2>
        Неделя: {moment(weekInfo.startDate).format('D MMMM YY')} - {moment(weekInfo.endDate).format('D MMMM YY')}
      </h2>
      <div className="half-navigation">
        <button onClick={() => setDisplayFirstHalf(true)}>Показать первую половину</button>
        <button onClick={() => setDisplayFirstHalf(false)}>Показать вторую половину</button>
      </div>
      <div className="week-days-container">
        {displayFirstHalf && weekInfo.id !== null && <FirstHalfOfWeek days={firstHalfDays} weekId={weekInfo.id} today={today} onTaskMove={fetchWeekInfo} />}
        {!displayFirstHalf && weekInfo.id !== null && <SecondHalfOfWeek days={secondHalfDays} weekId={weekInfo.id} today={today} onTaskMove={fetchWeekInfo} />}
      </div>
    </div>
  );
};

export default WeekView;