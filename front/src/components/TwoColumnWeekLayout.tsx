import React from 'react';
import type { Task } from '../services/api';
import { createDate, isSameDay } from '../utils/dateUtils';
import DayColumn from './DayColumn';
import NoteField from './NoteField'; // Импортируем NoteField
import './TwoColumnWeekLayout.css';

interface TwoColumnWeekLayoutProps {
  weekDays: Date[]; // Все 7 дней недели
  tasksForWeek: Task[];
  today: Date;
  onDataChange: () => void; // Общий обработчик изменения данных
}

const TwoColumnWeekLayout: React.FC<TwoColumnWeekLayoutProps> = ({
  weekDays,
  tasksForWeek,
  today,
  onDataChange,
}) => {
  const firstThreeDays = weekDays.slice(0, 3); // Пн, Вт, Ср
  const lastFourDays = weekDays.slice(3, 7);  // Чт, Пт, Сб, Вс

  const currentWeekId = weekDays[0] ? createDate(weekDays[0]).toISOString().slice(0,10) : undefined;

  const filterEventsForDay = (day: Date) => {
    const tasks = tasksForWeek.filter(task => isSameDay(day, createDate(task.dueDate)));
    // Фильтруем заметки для конкретного дня, если DayColumn их отображает
    return { tasks };
  };

  return (
    <div className="two-column-week-layout">
      <div className="left-section"> {/* Новая обертка для левой части */}
        {/* DayColumn для Пн, Вт, Ср теперь прямые дочерние элементы left-section */}
        {firstThreeDays.map((day, index) => {
          const { tasks } = filterEventsForDay(day);
          return (
            <DayColumn
              key={`${createDate(day).toISOString().slice(0,10)}-left-${index}`}
              fullDate={day}
              today={today}
              tasksForDay={tasks}
              onTaskMove={onDataChange}
            />
          );
        })}
        {currentWeekId && (
          <NoteField weekId={currentWeekId} onNoteSaved={onDataChange} />
        )}
      </div>
      <div className="week-column right-column"> {/* Правая колонка с остальными днями */}
        {lastFourDays.map((day, index) => {
          const { tasks } = filterEventsForDay(day);
          return (
            <DayColumn
              key={`${createDate(day).toISOString().slice(0,10)}-right-${index}`}
              fullDate={day}
              today={today}
              tasksForDay={tasks}
              onTaskMove={onDataChange}
            />
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(TwoColumnWeekLayout);