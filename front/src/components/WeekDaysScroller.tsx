import type { Moment } from 'moment';
import React, { useEffect, useRef } from 'react';
import type { Task } from '../services/api'; // Импортируем Task
import FirstHalfOfWeek from './FirstHalfOfWeek';
import SecondHalfOfWeek from './SecondHalfOfWeek';

interface WeekDaysScrollerProps {
  tasksForWeek: Task[]; // Заменяем weekInfo на tasksForWeek
  firstHalfDays: Moment[];
  secondHalfDays: Moment[];
  today: Moment;
  onTaskMove: () => void;
  isFirstHalfVisible: boolean;
}

const WeekDaysScroller: React.FC<WeekDaysScrollerProps> = ({
  tasksForWeek, // Используем tasksForWeek
  firstHalfDays,
  secondHalfDays,
  today,
  onTaskMove,
  isFirstHalfVisible,
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
  }, [isFirstHalfVisible]);

  return (
    <div
      className="week-days-container mobile-scroll-container"
      ref={scrollContainerRef}
      data-testid="week-days-container"
    >
      <div className="column-half">
        {/* weekInfo.id больше не используется для условного рендеринга,
            компоненты теперь всегда должны отображаться, если есть дни */}
        <FirstHalfOfWeek
          days={firstHalfDays}
          tasksForWeek={tasksForWeek} // Передаем tasksForWeek
          today={today}
          onTaskMove={onTaskMove}
        />
      </div>
      <div className="column-half">
        <SecondHalfOfWeek
          days={secondHalfDays}
          tasksForWeek={tasksForWeek} // Передаем tasksForWeek
          today={today}
          onTaskMove={onTaskMove}
        />
      </div>
    </div>
  );
};

export default WeekDaysScroller;