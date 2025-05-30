import type { Moment } from 'moment';
import React, { useEffect, useRef } from 'react';
import FirstHalfOfWeek from './FirstHalfOfWeek';
import SecondHalfOfWeek from './SecondHalfOfWeek';

interface WeekDaysScrollerProps {
  weekInfo: { id: string | null; startDate: string; endDate: string };
  firstHalfDays: Moment[];
  secondHalfDays: Moment[];
  today: Moment;
  onTaskMove: () => void;
  isFirstHalfVisible: boolean; // Добавляем новый пропс
}

const WeekDaysScroller: React.FC<WeekDaysScrollerProps> = ({
  weekInfo,
  firstHalfDays,
  secondHalfDays,
  today,
  onTaskMove,
  isFirstHalfVisible, // Деструктурируем isFirstHalfVisible
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      if (isFirstHalfVisible) {
        scrollContainerRef.current.style.transform = 'translateX(0)';
      } else {
        scrollContainerRef.current.style.transform = 'translateX(-50%)';
      }
    }
  }, [isFirstHalfVisible]); // Зависимость от isFirstHalfVisible

  return (
    <div
      className="week-days-container mobile-scroll-container"
      ref={scrollContainerRef}
      data-testid="week-days-container"
    >
      <div className="column-half">
        {weekInfo.id !== null && (
          <FirstHalfOfWeek
            days={firstHalfDays}
            weekId={weekInfo.id}
            today={today}
            onTaskMove={onTaskMove}
          />
        )}
      </div>
      <div className="column-half">
        {weekInfo.id !== null && (
          <SecondHalfOfWeek
            days={secondHalfDays}
            weekId={weekInfo.id}
            today={today}
            onTaskMove={onTaskMove}
          />
        )}
      </div>
    </div>
  );
};

export default WeekDaysScroller;