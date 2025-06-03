import React from 'react';
import type { Task } from '../services/api';
import { createDate, isSameDay } from '../utils/dateUtils';
import DayColumn from './DayColumn';
// import './TwoColumnWeekLayout.css'; // CSS файл больше не нужен, если все стили будут через Tailwind

interface TwoColumnWeekLayoutProps {
  weekDays: Date[]; // Все 7 дней недели
  tasksForWeek: Task[];
  today: Date;
  onDataChange: () => void; // Общий обработчик изменения данных
  onOpenTaskModal: (taskToEdit?: Task, taskType?: 'income' | 'expense', defaultDate?: Date) => void; // Новый проп
}

const TwoColumnWeekLayout: React.FC<TwoColumnWeekLayoutProps> = ({
  weekDays,
  tasksForWeek,
  today,
  onDataChange,
  onOpenTaskModal, // Получаем новый проп
}) => {
  const firstThreeDays = weekDays.slice(0, 3); // Пн, Вт, Ср
  const lastFourDays = weekDays.slice(3, 7);  // Чт, Пт, Сб, Вс

  // const currentWeekId = weekDays[0] ? createDate(weekDays[0]).toISOString().slice(0,10) : undefined; // Удалено, так как не используется

  const filterEventsForDay = (day: Date) => {
    const tasks = tasksForWeek.filter(task => isSameDay(day, createDate(task.dueDate)));
    // Фильтруем заметки для конкретного дня, если DayColumn их отображает
    return { tasks };
  };

  // Компонент теперь возвращает две колонки как React.Fragment
  // Основной grid будет в WeekView
  return (
    <React.Fragment>
      <div className="flex flex-col gap-4"> {/* Левая колонка дней */}
        {firstThreeDays.map((day, index) => {
          const { tasks } = filterEventsForDay(day);
          return (
            <DayColumn
              key={`${createDate(day).toISOString().slice(0,10)}-left-${index}`}
              fullDate={day}
              today={today}
              tasksForDay={tasks}
              onDataChange={onDataChange} // Исправлено с onTaskMove
              onOpenTaskModal={onOpenTaskModal}
            />
          );
        })}
      </div>
      <div className="flex flex-col gap-4"> {/* Правая колонка дней */}
        {lastFourDays.map((day, index) => {
          const { tasks } = filterEventsForDay(day);
          return (
            <DayColumn
              key={`${createDate(day).toISOString().slice(0,10)}-right-${index}`}
              fullDate={day}
              today={today}
              tasksForDay={tasks}
              onDataChange={onDataChange} // Исправлено с onTaskMove
              onOpenTaskModal={onOpenTaskModal}
            />
          );
        })}
      </div>
    </React.Fragment>
  );
};

export default React.memo(TwoColumnWeekLayout);