import type { Moment } from 'moment';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import FirstHalfOfWeek from './FirstHalfOfWeek';
import SecondHalfOfWeek from './SecondHalfOfWeek';

const WeekView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(moment());
  const [weekInfo, setWeekInfo] = useState<{ id: number | null; startDate: string; endDate: string }>({ id: null, startDate: '', endDate: '' });
  const [displayFirstHalf, setDisplayFirstHalf] = useState(true);
  const [today] = useState(moment()); // Состояние для получения текущего дня
  const [weekDays, setWeekDays] = useState<Moment[]>([]); // Добавляем состояние для дней недели

  useEffect(() => {
    const fetchWeekInfo = async () => {
      try {
        const formattedDate = currentDate.format('YYYY-MM-DD');
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        console.log('API Base URL:', baseUrl); // Добавляем логирование
        const response = await fetch(`${baseUrl}/weeks?date=${formattedDate}`);

        if (response.status === 404) {
          // Если неделя не найдена, создаем ее
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
            // Обновляем weekInfo данными, полученными от бэкенда
            setWeekInfo({ id: newWeekData.id, startDate: newWeekData.startDate, endDate: newWeekData.endDate });
          } else {
            console.error('Failed to create or retrieve week:', newWeekResponse.statusText);
          }
        } else if (response.ok) {
          const data = await response.json();
          setWeekInfo({ id: data.id, startDate: data.startDate, endDate: data.endDate });
        } else {
          console.error('Failed to fetch week info:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching or creating week info: ', error);
      }
    };

    fetchWeekInfo();
  }, [currentDate]);

  useEffect(() => {
    const startOfWeek = currentDate.clone().startOf('isoWeek'); // Используем isoWeek для получения начала недели с понедельника
    const days: Moment[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(startOfWeek.clone().add(i, 'days'));
    }
    setWeekDays(days);

    // Определяем текущий день недели и устанавливаем первую или вторую половину
    const currentDayOfWeek = today.isoWeekday(); // 1 для Пн, 7 для Вс
    if (currentDayOfWeek >= 1 && currentDayOfWeek <= 3) { // Пн, Вт, Ср
      setDisplayFirstHalf(true);
    } else { // Чт, Пт, Сб, Вс
      setDisplayFirstHalf(false);
    }
  }, [currentDate, today]);

  const goToPreviousWeek = () => {
    setCurrentDate(currentDate.clone().subtract(1, 'week'));
  };

  const goToNextWeek = () => {
    setCurrentDate(currentDate.clone().add(1, 'week'));
  };

  const firstHalfDays = weekDays.slice(0, 3); // Пн, Вт, Ср (Дни для первой половины)
  const secondHalfDays = [weekDays[3], ...weekDays.slice(4, 7)]; // Чт + Пт, Сб, Вс (Дни для второй половины)

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
        {displayFirstHalf && weekInfo.id !== null && <FirstHalfOfWeek days={firstHalfDays} weekId={weekInfo.id} today={today} />}
        {!displayFirstHalf && weekInfo.id !== null && <SecondHalfOfWeek days={secondHalfDays} weekId={weekInfo.id} today={today} />}
      </div>
    </div>
  );
};

export default WeekView;