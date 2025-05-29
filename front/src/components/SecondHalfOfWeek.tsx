import type { Moment } from 'moment';
import React from 'react';
import DayColumn from './DayColumn';

interface SecondHalfOfWeekProps {
  days: Moment[];
  weekId: string;
  today: Moment;
  onTaskMove: () => void;
}

const SecondHalfOfWeek: React.FC<SecondHalfOfWeekProps> = (props) => {
  const { days, weekId, today, onTaskMove } = props;
  return (
    <div className="second-half-of-week">
      <div className="day-columns-container">
        {days.map((dayMoment, index) => (
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
      </div>
    </div>
  );
};

export default React.memo(SecondHalfOfWeek);