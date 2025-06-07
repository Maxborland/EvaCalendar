import { memo } from 'react';
import type { Task } from '../services/api';
import { createDate, isSameDay } from '../utils/dateUtils';
import DayColumn from './DayColumn';
import NoteField from './NoteField';

interface FirstHalfOfWeekProps {
  days: Date[];
  tasksForWeek: Task[];
  today: Date;
  onDataChange: () => void;
  onOpenTaskModal: (taskToEdit?: Task, taskType?: 'income' | 'expense', defaultDate?: Date) => void;
}

const FirstHalfOfWeek = ({ days, tasksForWeek, today, onDataChange, onOpenTaskModal }: FirstHalfOfWeekProps) => {
  const daysToShow = days.slice(0, 3);

  return (
    <div className="first-half-of-week">
      <div className="day-columns-container">
        {daysToShow.map((dayMoment) => {
          const tasksForDay = tasksForWeek.filter(task =>
            isSameDay(createDate(task.dueDate), dayMoment)
          );
          return (
            <div key={createDate(dayMoment).toISOString().slice(0,10)} className="day-column-wrapper">
              <DayColumn
                fullDate={dayMoment}
                today={today}
                tasksForDay={tasksForDay}
                onDataChange={onDataChange}
                onOpenTaskModal={onOpenTaskModal}
              />
            </div>
          );
        })}
        {days.length > 0 && <NoteField weekId={createDate(days[0]).toISOString().slice(0,10)} />}
      </div>
    </div>
  );
};

export default memo(FirstHalfOfWeek);