import clsx from 'clsx';
import { memo, useMemo, useRef } from 'react';
import { useDrop, type DropTargetMonitor } from 'react-dnd';
import { useNavigate } from 'react-router-dom';
import { formatCompactMoneyNumber } from '../domain/moneyFormat';
import { getOptionalTaskAmount, isIncomeTask } from '../domain/taskRecord';
import { useUpdateTask } from '../hooks/useTasks';
import { type Task } from '../services/api';
import { formatDateForDayColumnHeader, formatDateToYYYYMMDD } from '../utils/dateUtils';


const ItemTypes = {
  EVENT_CARD: 'event_card',
};

interface DayColumnProps {
  fullDate: Date;
  today: Date;
  isToday?: boolean;
  tasksForDay: Task[];
  onDataChange?: () => void;
  onOpenTaskModal: (taskToEdit?: Task, taskType?: QuickTaskType, defaultDate?: Date) => void;
}

type QuickTaskType = 'income' | 'expense' | 'task' | 'lesson';
type DayPreviewVariant = 'income' | 'expense' | 'lesson' | 'task';

const MAX_VISIBLE_DAY_ITEMS = 3;

const isTimedTask = (task: Task) =>
  typeof task.time === 'string' && /^\d{2}:\d{2}$/.test(task.time);

const getPreviewVariant = (task: Task): DayPreviewVariant => {
  if (task.type === 'expense') return 'expense';
  if (task.type === 'lesson') return 'lesson';
  if (isIncomeTask(task)) return 'income';
  return 'task';
};

const getPreviewTitle = (task: Task) => {
  if (task.type === 'lesson') {
    return task.childName ? `${task.title || 'Занятие'} · ${task.childName}` : task.title || 'Занятие';
  }

  if (task.type === 'task') {
    return task.title || 'Задача';
  }

  if (task.type === 'expense') {
    return task.title || task.expenseCategoryName || 'Расход';
  }

  return task.title || task.childName || 'Доход';
};

const DayColumn = (props: DayColumnProps) => {
  const { fullDate, tasksForDay, onDataChange, onOpenTaskModal, isToday } = props;
  const navigate = useNavigate();

  const updateTaskMutation = useUpdateTask();
  const dayDateString = useMemo(() => formatDateToYYYYMMDD(fullDate), [fullDate]);

  const handleMoveEvent = async (eventId: string, itemTypeFromDrop: string, newDueDate: string) => {
    if (itemTypeFromDrop === 'task' || itemTypeFromDrop === 'income' || itemTypeFromDrop === 'expense') {
      await updateTaskMutation.mutateAsync({ uuid: eventId, data: { dueDate: newDueDate } });
    }
  };

  const dropRef = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.EVENT_CARD,
    drop: (item: { id: string; itemType: string; originalEvent: Task }, monitor: DropTargetMonitor) => {
      if (!monitor.didDrop() && item.id) {
        handleMoveEvent(item.id, item.itemType, dayDateString);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [dayDateString, onDataChange]);

  drop(dropRef);

  const openDay = () => {
    navigate(`/day/${dayDateString}`);
  };

  const orderedTasks = useMemo(() => {
    return [...tasksForDay].sort((left, right) => {
      const leftTimed = isTimedTask(left);
      const rightTimed = isTimedTask(right);

      if (leftTimed && rightTimed) {
        return left.time!.localeCompare(right.time!);
      }
      if (leftTimed) return -1;
      if (rightTimed) return 1;

      const priority: Record<DayPreviewVariant, number> = {
        lesson: 0,
        task: 1,
        income: 2,
        expense: 3,
      };

      return priority[getPreviewVariant(left)] - priority[getPreviewVariant(right)];
    });
  }, [tasksForDay]);
  const visibleTasks = orderedTasks.slice(0, MAX_VISIBLE_DAY_ITEMS);

  const dayHeader = (
    <div
      className="day-bento-header"
      aria-label={`Открыть день ${dayDateString}`}
    >
      <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1">
        <span className="day-bento-date">
          {formatDateForDayColumnHeader(fullDate)}
        </span>
      </div>
      <button
        type="button"
        className="day-bento-add"
        onClick={(e) => {
          e.stopPropagation();
          onOpenTaskModal(undefined, 'income', fullDate);
        }}
        aria-label="Добавить событие"
      >
        <span className="material-icons">add</span>
      </button>
    </div>
  );

  return (
    <div
      ref={dropRef}
      className={clsx(
        'day-bento-card',
        isToday && 'day-bento-card--today',
        isOver && 'day-bento-card--over',
      )}
    >
      <button
        type="button"
        className="day-bento-open-layer"
        onClick={openDay}
        aria-label={`Открыть день ${dayDateString}`}
      />
      {dayHeader}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <div className="day-bento-list" role="list" aria-label={`Дела на ${dayDateString}`}>
          {visibleTasks.length > 0 ? (
            <>
              {visibleTasks.map((task) => {
                const amount = getOptionalTaskAmount(task);
                const variant = getPreviewVariant(task);

                return (
                  <div
                    key={task.uuid}
                    className={`day-preview-item day-preview-item--${variant}`}
                    role="listitem"
                  >
                    <span className="day-preview-time">
                      {isTimedTask(task) ? task.time : '•'}
                    </span>
                    <span className="day-preview-title">{getPreviewTitle(task)}</span>
                    {typeof amount === 'number' && amount > 0 && (
                      <span className="day-preview-amount">
                        {task.type === 'expense' ? '-' : '+'}{formatCompactMoneyNumber(amount)}
                      </span>
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            <div className="day-bento-empty" aria-label="День свободен">
              <span>Свободно</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(DayColumn);
