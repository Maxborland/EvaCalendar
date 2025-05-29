import type { Moment } from 'moment';
import React from 'react';

interface DayColumnProps {
  day: string;
  fullDate: Moment;
  today: Moment;
}

const DayColumn: React.FC<DayColumnProps> = ({ day, fullDate, today }) => {
  const isToday = fullDate.isSame(today, 'day');
  const dayColumnClassName = `day-column ${isToday ? 'today-highlight' : ''}`;

  return (
    <div className={dayColumnClassName}>
      <h3>{day}</h3>
      <div className="day-cells">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="day-cell-empty"></div>
        ))}
      </div>
    </div>
  );
};

export default DayColumn;