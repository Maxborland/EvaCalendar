import type { Moment } from 'moment';
import React from 'react';
import DayColumn from './DayColumn';

interface SecondHalfOfWeekProps {
  days: Moment[];
  weekId: number | null;
  today: Moment;
}

const SecondHalfOfWeek: React.FC<SecondHalfOfWeekProps> = ({ days, weekId, today }) => {
  return (
    <div className="second-half-of-week">
      <h3>Вторая половина недели</h3>
      <div className="day-columns-container">
        {days.map((dayMoment, index) => (
          <div key={index} className="day-column-wrapper">
            <DayColumn day={dayMoment.format('D MMMM')} fullDate={dayMoment} today={today} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecondHalfOfWeek;