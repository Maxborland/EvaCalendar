import clsx from 'clsx';
import { memo, useEffect, useRef, useState } from 'react';
import { useDrop, type DropTargetMonitor } from 'react-dnd';
import { useNavigate } from 'react-router-dom';
import { useNav } from '../context/NavContext';
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
  onOpenTaskModal: (taskToEdit?: Task, taskType?: 'income' | 'expense', defaultDate?: Date) => void;
}

const DayColumn = (props: DayColumnProps) => {
  const { fullDate, tasksForDay, onDataChange, onOpenTaskModal, isToday } = props;
  const navigate = useNavigate();

  const { setIsNavVisible, setIsModalOpen } = useNav();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isModalOpenState, setIsModalOpenState] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentTask, setCurrentTask] = useState<Task | undefined>(undefined);
  const [currentTaskType, setCurrentTaskType] = useState<'income' | 'expense'>('income');

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const duplicateTaskMutation = useDuplicateTask();

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

  const handleOpenModal = (eventToEdit?: EventItem, type?: 'income' | 'expense') => {
    if (eventToEdit && (eventToEdit.itemType === 'task' || eventToEdit.itemType === 'expense')) {
      const taskToEdit = eventToEdit as Task;
      setCurrentTask(taskToEdit);
      setModalMode('edit');
      setCurrentTaskType(taskToEdit.type === 'expense' ? 'expense' : 'income');
    } else if (!eventToEdit) {
      const newInitialTask = {
        dueDate: createDate(fullDate).toISOString().slice(0, 10),
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
    const dateString = formatDateToYYYYMMDD(fullDate);
    navigate(`/day/${dateString}`);
  };

  const dayHeader = (
    <div
      className="flex items-center justify-between gap-[var(--spacing-sm)] shrink-0"
      onClick={handleHeaderClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleHeaderClick()}
    >
      <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1">
        <span className="text-sm font-semibold text-text-primary leading-tight min-[480px]:text-base max-[360px]:text-[0.8125rem]">
          {formatDateForDayColumnHeader(fullDate)}
        </span>
      </div>
      <button
        type="button"
        className="shrink-0 size-10 min-[480px]:size-11 rounded-[10px] border border-border-subtle bg-white/[0.04] text-text-primary inline-flex items-center justify-center transition-all duration-[160ms] hover:bg-white/[0.08] hover:border-border-strong hover:-translate-y-px active:translate-y-0 [&_.material-icons]:text-[20px] min-[480px]:[&_.material-icons]:text-[22px]"
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
            <div
              className="flex flex-col items-center gap-1 py-[var(--spacing-md)] px-[var(--spacing-sm)] border border-dashed border-border-strong rounded-[10px] bg-white/[0.02] cursor-pointer transition-all duration-[160ms] min-h-11 justify-center hover:bg-white/[0.06] hover:border-income-border group max-[360px]:py-[var(--spacing-sm)] max-[360px]:px-1"
              onClick={() => onOpenTaskModal(undefined, 'income', fullDate)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onOpenTaskModal(undefined, 'income', fullDate)}
            >
              <span className="material-icons text-[20px] text-text-tertiary group-hover:text-income-primary">add_circle_outline</span>
              <span className="text-xs text-text-tertiary max-[360px]:text-[0.7rem]">Нажмите, чтобы добавить</span>
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
