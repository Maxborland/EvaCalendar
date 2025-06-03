import React from 'react';
import type { Task } from '../services/api'; // Импортируем Task и Note
import { createDate, isSameDay } from '../utils/dateUtils';
import DayColumn from './DayColumn';

interface SecondHalfOfWeekProps {
  days: Date[];
  tasksForWeek: Task[]; // Заменяем weekId на tasksForWeek
  today: Date;
  // onTaskMove: () => void; // Заменено на onDataChange в DayColumn
  onDataChange: () => void; // Сделаем обязательным, так как DayColumn его ожидает
  onOpenTaskModal: (taskToEdit?: Task, taskType?: 'income' | 'expense', defaultDate?: Date) => void; // Добавлен обязательный проп
}

const SecondHalfOfWeek: React.FC<SecondHalfOfWeekProps> = (props) => {
  const { days, tasksForWeek, today, onDataChange, onOpenTaskModal } = props; // onTaskMove удален, onOpenTaskModal добавлен
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
                onDataChange={onDataChange} // Исправлено с onTaskMove
                onOpenTaskModal={onOpenTaskModal} // Передаем новый проп
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