import { memo } from 'react';
import type { Task } from '../services/api';
import { createDate, isSameDay } from '../utils/dateUtils';
import DayColumn from './DayColumn';

interface SecondHalfOfWeekProps {
  days: Date[];
  tasksForWeek: Task[];
  today: Date;
  onDataChange: () => void;
  onOpenTaskModal: (taskToEdit?: Task, taskType?: 'income' | 'expense', defaultDate?: Date) => void;
}

const SecondHalfOfWeek = (props: SecondHalfOfWeekProps) => {
  const { days, tasksForWeek, today, onDataChange, onOpenTaskModal } = props;
  return (
    <div className="second-half-of-week">
      <div className="day-columns-container">
        {days.map((dayMoment) => {
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
      </div>
    </div>
  );
};

export default memo(SecondHalfOfWeek);