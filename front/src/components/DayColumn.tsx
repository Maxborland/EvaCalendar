import clsx from 'clsx';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useDrop, type DropTargetMonitor } from 'react-dnd';
import { useNavigate } from 'react-router-dom';
import { useNav } from '../context/useNav';
import { getTaskMetrics } from '../domain/planningProjection';
import { useCreateTask, useDeleteTask, useDuplicateTask, useUpdateTask } from '../hooks/useTasks';
import { type Note, type Task } from '../services/api';
import { createDate, formatDateForDayColumnHeader, formatDateToYYYYMMDD } from '../utils/dateUtils';
import MiniEventCard, { type EventItem } from './MiniEventCard';
import UnifiedTaskFormModal from './UnifiedTaskFormModal';


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

const formatCompactMoney = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
    notation: Math.abs(value) >= 10000 ? 'compact' : 'standard',
  }).format(value);

const DayColumn = (props: DayColumnProps) => {
  const { fullDate, tasksForDay, onDataChange, onOpenTaskModal, isToday } = props;
  const navigate = useNavigate();

  const { setIsNavVisible, setIsModalOpen } = useNav();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isModalOpenState, setIsModalOpenState] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentTask, setCurrentTask] = useState<Task | undefined>(undefined);
  const [currentTaskType, setCurrentTaskType] = useState<QuickTaskType>('income');

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const duplicateTaskMutation = useDuplicateTask();
  const dayDateString = useMemo(() => formatDateToYYYYMMDD(fullDate), [fullDate]);

  useEffect(() => {
    const taskEvents: EventItem[] = tasksForDay.map(task => ({
      ...task,
      itemType: task.type === 'expense' ? 'expense' : 'task',
    }));

    const incomeEvents: EventItem[] = [];
    const expenseEvents: EventItem[] = [];
    const otherEvents: EventItem[] = [];

    taskEvents.forEach(event => {
      const task = event as Task;
      const isTimedLesson = task.type === 'lesson' && typeof task.time === 'string' && /^\d{2}:\d{2}$/.test(task.time);
      const isTimedIncome = task.type !== 'expense' && task.type !== 'lesson' && typeof task.time === 'string' && /^\d{2}:\d{2}$/.test(task.time);
      const isExpense = task.type === 'expense';

      if (isTimedIncome || isTimedLesson) {
        incomeEvents.push(event);
      } else if (isExpense) {
        expenseEvents.push(event);
      } else {
        otherEvents.push(event);
      }
    });

    incomeEvents.sort((a, b) => {
      const taskA = a as Task;
      const taskB = b as Task;
      if (taskA.time && taskB.time) {
        return taskA.time.localeCompare(taskB.time);
      }
      return 0;
    });
    const sortedEvents = [...incomeEvents, ...otherEvents, ...expenseEvents];
    setEvents(sortedEvents);
  }, [tasksForDay]);

  const handleOpenModal = (eventToEdit?: EventItem, type?: QuickTaskType) => {
    if (eventToEdit && (eventToEdit.itemType === 'task' || eventToEdit.itemType === 'expense')) {
      const taskToEdit = eventToEdit as Task;
      setCurrentTask(taskToEdit);
      setModalMode('edit');
      setCurrentTaskType(taskToEdit.type === 'expense' ? 'expense' : taskToEdit.type === 'task' ? 'task' : taskToEdit.type === 'lesson' ? 'lesson' : 'income');
    } else if (!eventToEdit) {
      const newInitialTask = {
        dueDate: dayDateString,
      };
      setCurrentTask(newInitialTask as Task);
      setModalMode('create');
      setCurrentTaskType(type || 'income');
    } else {
      return;
    }
    setIsModalOpenState(true);
    setIsNavVisible(false);
    setIsModalOpen(true);
  };


  const handleCloseModal = () => {
    setIsModalOpenState(false);
    setCurrentTask(undefined);
    setIsNavVisible(true);
    setIsModalOpen(false);
  };

  const handleSubmitTask = async (taskData: Task | Omit<Task, 'uuid'>): Promise<void> => {
    if ('uuid' in taskData && taskData.uuid) {
      const { uuid, ...updateData } = taskData;
      await updateTaskMutation.mutateAsync({ uuid, data: updateData as Partial<Omit<Task, 'uuid'>> });
    } else {
      await createTaskMutation.mutateAsync(taskData as Omit<Task, 'uuid'>);
    }
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTaskMutation.mutateAsync(id);
    handleCloseModal();
  };

  const handleDuplicateTask = async (id: string) => {
    await duplicateTaskMutation.mutateAsync(id);
    handleCloseModal();
  };


  const handleMoveEvent = async (eventId: string, itemTypeFromDrop: string, newDueDate: string) => {
    if (itemTypeFromDrop === 'task' || itemTypeFromDrop === 'income' || itemTypeFromDrop === 'expense') {
      await updateTaskMutation.mutateAsync({ uuid: eventId, data: { dueDate: newDueDate } });
    }
  };

  const dropRef = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.EVENT_CARD,
    drop: (item: { id: string; itemType: string; originalEvent: EventItem }, monitor: DropTargetMonitor) => {
      if (!monitor.didDrop() && item.id) {
        handleMoveEvent(item.id, item.itemType, createDate(props.fullDate).toISOString().slice(0, 10));
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [props.fullDate, onDataChange]);

  drop(dropRef);

  const handleHeaderClick = () => {
    navigate(`/day/${dayDateString}`);
  };

  const dayMetrics = useMemo(() => getTaskMetrics(tasksForDay), [tasksForDay]);

  const quickActions: Array<{ type: QuickTaskType; label: string; icon: string; className: string }> = [
    {
      type: 'income',
      label: 'Доход',
      icon: 'add_card',
      className: 'text-income-primary border-income-border bg-income-bg',
    },
    {
      type: 'expense',
      label: 'Расход',
      icon: 'payments',
      className: 'text-expense-primary border-expense-border bg-expense-bg',
    },
    {
      type: 'task',
      label: 'Задача',
      icon: 'task_alt',
      className: 'text-[var(--color-task-primary)] border-[var(--color-task-border)] bg-[var(--color-task-bg)]',
    },
    {
      type: 'lesson',
      label: 'Занятие',
      icon: 'school',
      className: 'text-[var(--color-lesson-primary)] border-[var(--color-lesson-border)] bg-[var(--color-lesson-bg)]',
    },
  ];

  const dayHeader = (
    <div
      className="min-h-11 flex items-center justify-between gap-[var(--spacing-sm)] shrink-0"
      onClick={handleHeaderClick}
      role="button"
      tabIndex={0}
      aria-label={`Открыть день ${dayDateString}`}
      onKeyDown={(e) => e.key === 'Enter' && handleHeaderClick()}
    >
      <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1">
        <span className="text-sm font-semibold text-text-primary leading-tight min-[480px]:text-base max-[360px]:text-[0.8125rem]">
          {formatDateForDayColumnHeader(fullDate)}
        </span>
      </div>
      <button
        type="button"
        className="shrink-0 size-11 rounded-[10px] border border-border-subtle bg-white/[0.04] text-text-primary inline-flex items-center justify-center transition-all duration-[160ms] hover:bg-white/[0.08] hover:border-border-strong hover:-translate-y-px active:translate-y-0 [&_.material-icons]:text-[22px]"
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
        'flex flex-col gap-[var(--spacing-sm)] p-[var(--spacing-sm)] rounded-xl bg-surface-raised border border-border-subtle shadow-glass transition-[border-color,box-shadow] duration-200 min-h-0 h-full overflow-hidden',
        'min-[480px]:p-[var(--spacing-md)] min-[480px]:gap-[var(--spacing-md)]',
        'max-[360px]:p-1.5 max-[360px]:gap-1.5 max-[360px]:rounded-[10px]',
        isToday && 'border-[var(--theme-primary)] shadow-[0_0_0_1px_var(--theme-primary),var(--elevation-1)]',
        isOver && 'outline-2 outline-dashed outline-[var(--theme-primary)] outline-offset-[4px]',
      )}
    >
      {dayHeader}
      {(dayMetrics.income > 0 || dayMetrics.expense > 0 || dayMetrics.tasks > 0 || dayMetrics.lessons > 0) && (
        <div className="grid grid-cols-2 gap-1.5 text-[0.6875rem] leading-tight">
          {dayMetrics.income > 0 && (
            <span className="min-h-7 rounded-lg border border-income-border bg-income-bg px-2 py-1 text-income-primary font-semibold flex items-center gap-1 min-w-0">
              <span className="material-icons text-[14px]" aria-hidden="true">trending_up</span>
              <span className="truncate">+{formatCompactMoney(dayMetrics.income)} ₽</span>
            </span>
          )}
          {dayMetrics.expense > 0 && (
            <span className="min-h-7 rounded-lg border border-expense-border bg-expense-bg px-2 py-1 text-expense-primary font-semibold flex items-center gap-1 min-w-0">
              <span className="material-icons text-[14px]" aria-hidden="true">trending_down</span>
              <span className="truncate">-{formatCompactMoney(dayMetrics.expense)} ₽</span>
            </span>
          )}
          {dayMetrics.tasks > 0 && (
            <span
              className={clsx(
                'min-h-7 rounded-lg border px-2 py-1 font-semibold flex items-center gap-1 min-w-0',
                dayMetrics.openTasks > 0
                  ? 'border-[var(--color-task-border)] bg-[var(--color-task-bg)] text-[var(--color-task-primary)]'
                  : 'border-income-border bg-income-bg text-income-primary',
              )}
            >
              <span className="material-icons text-[14px]" aria-hidden="true">task_alt</span>
              <span className="truncate">{dayMetrics.openTasks}/{dayMetrics.tasks}</span>
            </span>
          )}
          {dayMetrics.lessons > 0 && (
            <span className="min-h-7 rounded-lg border border-[var(--color-lesson-border)] bg-[var(--color-lesson-bg)] px-2 py-1 text-[var(--color-lesson-primary)] font-semibold flex items-center gap-1 min-w-0">
              <span className="material-icons text-[14px]" aria-hidden="true">school</span>
              <span className="truncate">{dayMetrics.lessons}</span>
            </span>
          )}
        </div>
      )}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <div className="flex flex-col gap-1.5 h-full overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin min-[480px]:gap-[var(--spacing-sm)] max-[360px]:gap-1" role="list">
          {events.length > 0 ? (
            events.map((event) => {
              const key = (event as Task).uuid || (event as Note).uuid;
              return (
                <MiniEventCard
                  key={key}
                  event={event}
                  onEdit={(editedEvent) => handleOpenModal(editedEvent)}
                />
              );
            })
          ) : (
            <div className="grid grid-cols-2 gap-1.5" aria-label="Быстро добавить">
              {quickActions.map((action) => (
                <button
                  key={action.type}
                  type="button"
                  className={clsx(
                    'min-h-11 rounded-[10px] border px-2.5 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold transition-all duration-[160ms] active:scale-[0.98]',
                    action.className,
                  )}
                  onClick={() => onOpenTaskModal(undefined, action.type, fullDate)}
                  aria-label={`Добавить ${action.label.toLowerCase()} на ${dayDateString}`}
                >
                  <span className="material-icons text-[17px]" aria-hidden="true">{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {isModalOpenState && (
        <UnifiedTaskFormModal
          isOpen={isModalOpenState}
          onClose={handleCloseModal}
          onSubmit={handleSubmitTask}
          onTaskUpsert={() => {
            handleCloseModal();
          }}
          mode={modalMode}
          initialTaskData={currentTask}
          initialTaskType={currentTaskType}
          onDelete={currentTask?.uuid ? handleDeleteTask : undefined}
          onDuplicate={currentTask?.uuid ? handleDuplicateTask : undefined}
        />
      )}
    </div>
  );
};

export default memo(DayColumn);
