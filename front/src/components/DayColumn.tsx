import React, { useEffect, useRef, useState } from 'react'; // useCallback удален, так как fetchTasks удаляется
import { useDrop, type DropTargetMonitor } from 'react-dnd';
import { useNavigate } from 'react-router-dom'; // Добавлен useNavigate
import { useNav } from '../context/NavContext';
import { createTask, deleteTask, duplicateTask, moveTask, updateTask, type Note, type Task } from '../services/api'; // getTasksByWeekAndDay удален, Task и Note импортированы, добавлены createTask, updateTask
import { createDate, formatDateForDayColumnHeader, isSameDay } from '../utils/dateUtils';
import './DayColumn.css';
import MiniEventCard, { type EventItem } from './MiniEventCard'; // Заменяем TaskItem на MiniEventCard
import UnifiedTaskFormModal from './UnifiedTaskFormModal'; // Замена TaskForm
// TaskItem больше не используется
// import TaskItem from './TaskItem';


const ItemTypes = {
  EVENT_CARD: 'event_card', // Изменено с TASK на EVENT_CARD для соответствия MiniEventCard
};

interface DayColumnProps {
  // day: string; // Это общее название дня (например, "Пн", "Вт") - больше не нужно, будем формировать из fullDate
  fullDate: Date;
  today: Date;
  tasksForDay: Task[];
  onTaskMove: () => void; // Переименуем в onDataChange для общности
}

const DayColumn: React.FC<DayColumnProps> = (props) => {
  const { fullDate, today, tasksForDay, onTaskMove: onDataChange } = props;
  const navigate = useNavigate(); // Инициализируем useNavigate

  const isToday = isSameDay(fullDate, today);
  // Обновляем класс для соответствия макету (фон для today)
  const dayColumnClassName = `day-column ${isToday ? 'today' : ''}`;


  const { setIsNavVisible, setIsModalOpen } = useNav();
  const [events, setEvents] = useState<EventItem[]>([]);
  // Состояния для UnifiedTaskFormModal
  const [isModalOpenState, setIsModalOpenState] = useState(false); // Локальное состояние для модалки
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
    const otherEvents: EventItem[] = []; // Для задач, которые не являются явным доходом или расходом по времени

    taskEvents.forEach(event => {
      const task = event as Task;
      const isTimedIncome = task.type !== 'expense' && typeof task.time === 'string' && /^\d{2}:\d{2}$/.test(task.time);
      const isExpense = task.type === 'expense';

      if (isTimedIncome) {
        incomeEvents.push(event);
      } else if (isExpense) {
        expenseEvents.push(event);
      } else {
        otherEvents.push(event); // Остальные задачи (без времени или не расходы)
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
    // Расходы и "другие" задачи пока не сортируем по времени, можно добавить если нужно
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
      setCurrentTask(undefined);
      setModalMode('create');
      setCurrentTaskType(type || 'income'); // Используем переданный тип или 'income' по умолчанию
    } else {
      // console.log('Editing this event type via UnifiedTaskFormModal is not supported:', eventToEdit.itemType); // Можно оставить для редких случаев
      return;
    }
    setIsModalOpenState(true); // Используем локальное состояние
    setIsNavVisible(false);
    setIsModalOpen(true); // Глобальное состояние для оверлея
  };


  const handleCloseModal = () => {
    setIsModalOpenState(false); // Используем локальное состояние
    setCurrentTask(undefined);
    setIsNavVisible(true);
    setIsModalOpen(false); // Глобальное состояние
  };

  const handleSubmitTask = async (taskData: Task | Omit<Task, 'uuid'>) => {
    try {
      if ('uuid' in taskData && taskData.uuid) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { uuid, ...updateData } = taskData;
        await updateTask(taskData.uuid, updateData as Partial<Omit<Task, 'uuid'>>);
      } else {
        await createTask(taskData as Omit<Task, 'uuid'>);
      }
      onDataChange();
      handleCloseModal();
    } catch (error) {
      console.error('Ошибка при сохранении задачи в DayColumn:', error);
      // Можно добавить toast для пользователя
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
      onDataChange();
      handleCloseModal(); // Закрываем модальное окно после удаления
    } catch (error) {
      console.error(`Ошибка при удалении задачи:`, error);
      // Можно показать toast с ошибкой
    }
  };

  const handleDuplicateTask = async (id: string) => {
    try {
      await duplicateTask(id);
      onDataChange();
      handleCloseModal(); // Закрываем модальное окно после дублирования
    } catch (error) {
      console.error(`Ошибка при дублировании задачи:`, error);
      // Можно показать toast с ошибкой
    }
  };


  const handleMoveEvent = async (eventId: string, itemTypeFromDrop: string, newDueDate: string) => {
    // Используем itemTypeFromDrop, который приходит из useDrop
    if (itemTypeFromDrop === 'task' || itemTypeFromDrop === 'income' || itemTypeFromDrop === 'expense') {
      try {
        await moveTask(eventId, newDueDate);
        onDataChange();
      } catch (error) {
        console.error('Ошибка при перемещении задачи:', error);
      }
    } else {
      console.warn(`Moving for ${itemTypeFromDrop} (id: ${eventId}) not implemented yet.`);
    }
  };

  const dropRef = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.EVENT_CARD, // Изменено с TASK
    drop: (item: { id: string; itemType: string; originalEvent: EventItem }, monitor: DropTargetMonitor) => {
      if (!monitor.didDrop() && item.id) {
        handleMoveEvent(item.id, item.itemType, createDate(props.fullDate).toISOString().slice(0, 10));
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [props.fullDate, onDataChange]); // Зависимости обновлены

  drop(dropRef);

  const handleHeaderClick = () => {
    const dateString = createDate(fullDate).toISOString().slice(0, 10);
    navigate(`/day/${dateString}`);
  };

  const dayHeader = (
    <div className={`day-header ${isToday ? 'today-header-highlight' : ''}`} onClick={handleHeaderClick} role="button" tabIndex={0}
         onKeyDown={(e) => e.key === 'Enter' && handleHeaderClick()}>
      <span className="day-name">{formatDateForDayColumnHeader(fullDate)}</span>
      {/* Обновляем кнопки для открытия модального окна с указанием типа */}
      <div className="add-task-button-container">
        <button className="add-event-button" onClick={(e) => { e.stopPropagation(); handleOpenModal(undefined, 'income'); }}>+</button>
        {/* Можно добавить отдельную кнопку для расхода, если это требуется по дизайну */}
        {/* <button className="add-event-button expense" onClick={(e) => { e.stopPropagation(); handleOpenModal(undefined, 'expense'); }}>-</button> */}
      </div>
    </div>
  );

  return (
    <div ref={dropRef} className={`${dayColumnClassName} ${isOver ? 'highlighted-drop-zone' : ''}`}>
      {dayHeader}
      <div className="tasks-list-container">
        {events.length > 0 ? (
          events.map((event) => {
            // Определяем ключ: используем 'uuid' для Task и Note
            const key = (event as Task).uuid || (event as Note).uuid;
            return (
              <MiniEventCard
                key={key}
                event={event}
                onEdit={(editedEvent) => handleOpenModal(editedEvent)} // Передаем событие в handleOpenModal
              />
            );
          })
        ) : (
          <div className="empty-day-placeholder">Нет событий</div>
        )}
      </div>
      {isModalOpenState && ( // Используем локальное состояние для отображения
        <UnifiedTaskFormModal
          isOpen={isModalOpenState}
          onClose={handleCloseModal}
          onSubmit={handleSubmitTask}
          mode={modalMode}
          initialTaskData={currentTask}
          initialTaskType={currentTaskType} // Исправлено taskType на initialTaskType
          onDelete={currentTask?.uuid ? handleDeleteTask : undefined}
          onDuplicate={currentTask?.uuid ? handleDuplicateTask : undefined}
        />
      )}
    </div>
  );
};

export default React.memo(DayColumn);
