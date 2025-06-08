import clsx from 'clsx';
import { memo, useEffect, useRef, useState } from 'react';
import { useDrop, type DropTargetMonitor } from 'react-dnd';
import { useNavigate, useRevalidator } from 'react-router-dom';
import { useNav } from '../context/NavContext';
import { createTask, deleteTask, duplicateTask, moveTask, updateTask, type Note, type Task } from '../services/api';
import { createDate, formatDateForDayColumnHeader, formatDateToYYYYMMDD } from '../utils/dateUtils';
import './DayColumn.css';
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

  const revalidator = useRevalidator();
  const dayColumnClassName = clsx('bg-card', 'p-3', 'rounded-lg', {
    'today': isToday
  });

  const { setIsNavVisible, setIsModalOpen } = useNav();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isModalOpenState, setIsModalOpenState] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentTask, setCurrentTask] = useState<Task | undefined>(undefined);
  const [currentTaskType, setCurrentTaskType] = useState<'income' | 'expense'>('income');


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
      const isTimedIncome = task.type !== 'expense' && typeof task.time === 'string' && /^\d{2}:\d{2}$/.test(task.time);
      const isExpense = task.type === 'expense';

      if (isTimedIncome) {
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
    try {
      if ('uuid' in taskData && taskData.uuid) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { uuid, ...updateData } = taskData;
        await updateTask(taskData.uuid, updateData as Partial<Omit<Task, 'uuid'>>);
      } else {
        await createTask(taskData as Omit<Task, 'uuid'>);
      }
    } catch (error) {
      // Ошибка при сохранении задачи в DayColumn
      throw error;
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
      revalidator.revalidate();
      handleCloseModal();
    } catch (error) {
      // Ошибка при удалении задачи
    }
  };

  const handleDuplicateTask = async (id: string) => {
    try {
      await duplicateTask(id);
      revalidator.revalidate();
      handleCloseModal();
    } catch (error) {
      // Ошибка при дублировании задачи
    }
  };


  const handleMoveEvent = async (eventId: string, itemTypeFromDrop: string, newDueDate: string) => {
    if (itemTypeFromDrop === 'task' || itemTypeFromDrop === 'income' || itemTypeFromDrop === 'expense') {
      try {
        await moveTask(eventId, newDueDate);
        revalidator.revalidate();
      } catch (error) {
        // Ошибка при перемещении задачи
      }
    } else {
      // Moving for itemTypeFromDrop not implemented yet.
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
      className="flex justify-between items-center mb-2"
      onClick={handleHeaderClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleHeaderClick()}
    >
      <span className="text-sm text-gray-400">{formatDateForDayColumnHeader(fullDate)}</span>
      <button
        className="bg-button-green p-1 rounded"
        onClick={(e) => { e.stopPropagation(); onOpenTaskModal(undefined, 'income', fullDate); }}
        aria-label="Добавить событие"
      >
        <span className="material-icons text-sm">add</span>
      </button>
    </div>
  );

  return (
    <div ref={dropRef} className={clsx(dayColumnClassName, { 'highlighted-drop-zone': isOver })}>
      {dayHeader}
      <div className="space-y-2 max-h-24 overflow-y-auto">
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
          <p className="text-sm text-gray-500">Нет событий</p>
        )}
      </div>
      {isModalOpenState && (
        <UnifiedTaskFormModal
          isOpen={isModalOpenState}
          onClose={handleCloseModal}
          onSubmit={handleSubmitTask}
          onTaskUpsert={() => {
            revalidator.revalidate();
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
