import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { addDays, formatDate, getDayName } from '../utils/helpers';
import DayColumn from './DayColumn';
import './WeekView.css';

const WeekView: React.FC = () => {
  const { currentWeekStart, tasks } = useAppContext();
  const [currentPage, setCurrentPage] = useState(0); // 0 for Mon-Wed, 1 for Thu-Sun

  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(currentWeekStart, i);
    return {
      dayOfWeek: i === 0 ? 0 : i, // SQLite stores Sunday as 0, Monday as 1, etc.
      date: date,
      name: getDayName(i === 0 ? 0 : i), // Adjust for getDayName if needed
    };
  });

  // Filter tasks for the current week
  const currentWeekTasks = tasks.filter(task => task.weekStart === formatDate(currentWeekStart));

  const getTasksForDay = (dayOfWeek: number) => {
    return currentWeekTasks.filter(task => task.dayOfWeek === dayOfWeek);
  };

  const handleNextPage = () => {
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage(0);
  };

  const firstPageDays = [
    { dayOfWeek: 1, name: 'Понедельник' },
    { dayOfWeek: 2, name: 'Вторник' },
    { dayOfWeek: 3, name: 'Среда' },
  ];

  const secondPageDays = [
    { dayOfWeek: 4, name: 'Четверг' },
    { dayOfWeek: 5, name: 'Пятница' },
    { dayOfWeek: 6, name: 'Суббота' },
    { dayOfWeek: 0, name: 'Воскресенье' }, // Sunday is 0 in JS getDay()
  ];

  const daysToDisplay = currentPage === 0 ? firstPageDays : secondPageDays;

  return (
    <div className="week-view-container">
      <div className="page-navigation">
        <button onClick={handlePreviousPage} disabled={currentPage === 0}>Понедельник - Среда</button>
        <button onClick={handleNextPage} disabled={currentPage === 1}>Четверг - Воскресенье</button>
      </div>
      <div className="week-pages">
        <div className={`week-page ${currentPage === 0 ? 'active' : ''}`}>
          {firstPageDays.map((dayInfo) => (
            <DayColumn
              key={dayInfo.dayOfWeek}
              dayName={dayInfo.name}
              dayOfWeek={dayInfo.dayOfWeek}
              date={addDays(currentWeekStart, dayInfo.dayOfWeek === 0 ? 6 : dayInfo.dayOfWeek - 1)} // Adjust date for Sunday
              tasks={getTasksForDay(dayInfo.dayOfWeek)}
            />
          ))}
          <div className="notes-column">
            <h3>Заметки</h3>
            <textarea placeholder="Добавьте свои заметки здесь..."></textarea>
          </div>
        </div>
        <div className={`week-page ${currentPage === 1 ? 'active' : ''}`}>
          {secondPageDays.map((dayInfo) => (
            <DayColumn
              key={dayInfo.dayOfWeek}
              dayName={dayInfo.name}
              dayOfWeek={dayInfo.dayOfWeek}
              date={addDays(currentWeekStart, dayInfo.dayOfWeek === 0 ? 6 : dayInfo.dayOfWeek - 1)} // Adjust date for Sunday
              tasks={getTasksForDay(dayInfo.dayOfWeek)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekView;