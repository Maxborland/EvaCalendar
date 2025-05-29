import type { Moment } from 'moment';
import React from 'react';
import DayColumn from './DayColumn';
import NoteField from './NoteField.tsx';

interface FirstHalfOfWeekProps {
  days: Moment[];
  weekId: string;
  today: Moment;
  onTaskMove: () => void;
}

const FirstHalfOfWeek: React.FC<FirstHalfOfWeekProps> = ({ days, weekId, today, onTaskMove }) => {
  const daysToShow = days.slice(0, 3); // Понедельник, Вторник, Среда

  return (
    <div className="first-half-of-week">
      <h3>Первая половина недели</h3>
      <div className="day-columns-container">
        {daysToShow.map((dayMoment, index) => (
          <div key={index} className="day-column-wrapper">
            <DayColumn
              day={dayMoment.format('D MMMM')}
              fullDate={dayMoment}
              today={today}
              weekId={weekId}
              onTaskMove={onTaskMove}
            />
          </div>
        ))}
        {weekId && <NoteField weekId={Number(weekId)} />}
      </div>
    </div>
  );
};

export default FirstHalfOfWeek;