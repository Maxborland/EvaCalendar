import type { Moment } from 'moment';
import moment from 'moment'; // Импортируем moment для сравнения дат
import React from 'react';
import type { Task } from '../services/api'; // Импортируем Task
import DayColumn from './DayColumn';

interface SecondHalfOfWeekProps {
  days: Moment[];
  tasksForWeek: Task[]; // Заменяем weekId на tasksForWeek
  today: Moment;
  onTaskMove: () => void;
}

const SecondHalfOfWeek: React.FC<SecondHalfOfWeekProps> = (props) => {
  const { days, tasksForWeek, today, onTaskMove } = props;
  return (
    <div className="second-half-of-week">
      <div className="day-columns-container">
        {days.map((dayMoment, index) => {
          // Фильтруем задачи для текущего дня
          const tasksForDay = tasksForWeek.filter(task =>
            moment(task.dueDate).isSame(dayMoment, 'day')
          );

          return (
            <div key={index} className="day-column-wrapper">
              <DayColumn
                day={dayMoment.format('D MMMM')}
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