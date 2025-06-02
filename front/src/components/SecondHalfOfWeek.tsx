import React from 'react';
import type { Task } from '../services/api'; // Импортируем Task и Note
import { createDate, isSameDay } from '../utils/dateUtils';
import DayColumn from './DayColumn';

interface SecondHalfOfWeekProps {
  days: Date[];
  tasksForWeek: Task[]; // Заменяем weekId на tasksForWeek
  today: Date;
  onTaskMove: () => void;
}

const SecondHalfOfWeek: React.FC<SecondHalfOfWeekProps> = (props) => {
  const { days, tasksForWeek, today, onTaskMove } = props;
  return (
    <div className="second-half-of-week">
      <div className="day-columns-container">
        {days.map((dayMoment) => {
          // Фильтруем задачи для текущего дня
          const tasksForDay = tasksForWeek.filter(task =>
            isSameDay(createDate(task.dueDate), dayMoment)
          );

          return (
            <div key={createDate(dayMoment).toISOString().slice(0,10)} className="day-column-wrapper">
              <DayColumn
                fullDate={dayMoment}
                today={today}
                tasksForDay={tasksForDay} // Передаем отфильтрованные задачи
                onTaskMove={onTaskMove}
                // weekId больше не передается
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(SecondHalfOfWeek);