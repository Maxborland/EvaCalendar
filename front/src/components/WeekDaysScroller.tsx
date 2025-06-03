import React, { useEffect, useRef } from 'react';
import type { Note, Task } from '../services/api'; // Импортируем Task и Note
import FirstHalfOfWeek from './FirstHalfOfWeek';
import SecondHalfOfWeek from './SecondHalfOfWeek';

interface WeekDaysScrollerProps {
  tasksForWeek: Task[]; // Заменяем weekInfo на tasksForWeek
  notesForWeek: Note[]; // Добавляем notesForWeek
  firstHalfDays: Date[];
  secondHalfDays: Date[];
  today: Date;
  // onTaskMove: () => void; // Больше не используется, заменен на onDataChange в дочерних компонентах
  onDataChange?: () => void; // Новый опциональный колбэк
  isFirstHalfVisible: boolean;
  onOpenTaskModal: (taskToEdit?: Task, taskType?: 'income' | 'expense', defaultDate?: Date) => void;
}

const WeekDaysScroller: React.FC<WeekDaysScrollerProps> = ({
  tasksForWeek, // Используем tasksForWeek
  // TODO: Implement or remove unused variable/prop
  // notesForWeek, // Добавляем notesForWeek
  firstHalfDays,
  secondHalfDays,
  today,
  // onTaskMove, // Больше не используется
  onDataChange, // Добавляем onDataChange
  isFirstHalfVisible,
  onOpenTaskModal,
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
          onDataChange={() => {
            if (onDataChange) {
              onDataChange();
            }
          }}
          onOpenTaskModal={onOpenTaskModal}
        />
      </div>
      <div className="column-half">
        <SecondHalfOfWeek
          days={secondHalfDays}
          tasksForWeek={tasksForWeek} // Передаем tasksForWeek
          today={today}
          onDataChange={() => {
            if (onDataChange) {
              onDataChange();
            }
          }}
          onOpenTaskModal={onOpenTaskModal}
        />
      </div>
    </div>
  );
};

export default WeekDaysScroller;