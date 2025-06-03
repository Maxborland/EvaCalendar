import React from 'react';
import type { Task } from '../services/api'; // Импортируем Task и Note
import { createDate, isSameDay } from '../utils/dateUtils';
import DayColumn from './DayColumn';
import NoteField from './NoteField'; // Добавляем импорт NoteField

interface FirstHalfOfWeekProps {
  days: Date[];
  tasksForWeek: Task[]; // Заменяем weekId на tasksForWeek
  today: Date;
  // onTaskMove: () => void; // Заменено на onDataChange в DayColumn
  onDataChange: () => void; // Сделаем обязательным, так как DayColumn его ожидает
  onOpenTaskModal: (taskToEdit?: Task, taskType?: 'income' | 'expense', defaultDate?: Date) => void; // Добавлен обязательный проп
}

const FirstHalfOfWeek: React.FC<FirstHalfOfWeekProps> = ({ days, tasksForWeek, today, onDataChange, onOpenTaskModal }) => { // onTaskMove удален, onOpenTaskModal добавлен
  const daysToShow = days.slice(0, 3); // Понедельник, Вторник, Среда

  return (
    <div className="first-half-of-week">
      <div className="day-columns-container">
        {daysToShow.map((dayMoment) => {
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
        {/* NoteField может потребовать отдельной логики, если он зависел от weekId
            Пока оставляем его без изменений, но это нужно будет проверить.
            Если NoteField должен быть привязан к неделе, а не к конкретному дню,
            то его логику нужно будет пересмотреть.
            Для текущей задачи фокусируемся на DayColumn.
            Предположим, что NoteField не зависит от weekId или будет удален/изменен отдельно.
            Для простоты, пока уберем его, если он строго зависел от weekId.
            Если он должен остаться, нужно будет передать ему необходимые данные.
            Учитывая, что weekId удален, NoteField в его текущем виде не будет работать.
            Возможно, его нужно будет привязать к startDate недели или удалить.
            Пока закомментируем, чтобы не было ошибок.
        */}
        {days.length > 0 && <NoteField weekId={createDate(days[0]).toISOString().slice(0,10)} onNoteSaved={() => {
          if (onDataChange) {
            onDataChange();
          }
        }} />}
      </div>
    </div>
  );
};

export default React.memo(FirstHalfOfWeek);