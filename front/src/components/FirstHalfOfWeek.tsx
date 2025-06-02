import type { Moment } from 'moment';
import moment from 'moment'; // Импортируем moment для сравнения дат
import React from 'react';
import type { Task } from '../services/api'; // Импортируем Task и Note
import DayColumn from './DayColumn';
import NoteField from './NoteField'; // Добавляем импорт NoteField

interface FirstHalfOfWeekProps {
  days: Moment[];
  tasksForWeek: Task[]; // Заменяем weekId на tasksForWeek
  today: Moment;
  onTaskMove: () => void;
  onDataChange?: () => void; // Новый опциональный колбэк
}

const FirstHalfOfWeek: React.FC<FirstHalfOfWeekProps> = ({ days, tasksForWeek, today, onTaskMove, onDataChange }) => {
  const daysToShow = days.slice(0, 3); // Понедельник, Вторник, Среда

  return (
    <div className="first-half-of-week">
      <div className="day-columns-container">
        {daysToShow.map((dayMoment) => {
          // Фильтруем задачи для текущего дня
          const tasksForDay = tasksForWeek.filter(task =>
            moment(task.dueDate).isSame(dayMoment, 'day')
          );
          return (
            <div key={dayMoment.format('YYYY-MM-DD')} className="day-column-wrapper">
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
        {days.length > 0 && <NoteField weekId={days[0].format('YYYY-MM-DD')} onNoteSaved={() => {
          if (onDataChange) {
            onDataChange();
          }
        }} />}
      </div>
    </div>
  );
};

export default React.memo(FirstHalfOfWeek);