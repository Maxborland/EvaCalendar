import React, { useEffect, useRef, useState } from 'react'; // useCallback удален, так как fetchTasks удаляется
import { useDrop, type DropTargetMonitor } from 'react-dnd';
import { useNavigate } from 'react-router-dom'; // Добавлен useNavigate
import { useNav } from '../context/NavContext';
import { deleteTask, duplicateTask, moveTask, type Note, type Task } from '../services/api'; // getTasksByWeekAndDay удален, Task и Note импортированы
import { createDate, formatDateForDayColumnHeader, isSameDay } from '../utils/dateUtils';
import './DayColumn.css';
import MiniEventCard, { type EventItem } from './MiniEventCard'; // Заменяем TaskItem на MiniEventCard
import TaskForm from './TaskForm';
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
  const [showForm, setShowForm] = useState(false);
  // Обновляем тип editingEvent для соответствия TaskFormProps.initialData
  const [editingEvent, setEditingEvent] = useState< (Partial<Task> & { formType: 'income' | 'expense' }) | undefined >(undefined);


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

  const handleOpenForm = (eventToEdit?: EventItem) => {
    if (eventToEdit && (eventToEdit.itemType === 'task' || eventToEdit.itemType === 'expense')) {
      const taskToEdit = eventToEdit as Task;
      setEditingEvent({
        ...taskToEdit,
        formType: taskToEdit.type === 'expense' ? 'expense' : 'income', // Устанавливаем formType для формы
      });
    } else if (!eventToEdit) {
      setEditingEvent({
        formType: 'income', // Тип по умолчанию для новой задачи в форме
        title: '',
        dueDate: createDate(props.fullDate).toISOString().slice(0, 10),
      });
    } else {
      console.log('Editing this event type via TaskForm is not supported:', eventToEdit.itemType);
      return;
    }
    setShowForm(true);
    setIsNavVisible(false);
    setIsModalOpen(true);
  };


  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEvent(undefined);
    setIsNavVisible(true);
    setIsModalOpen(false);
  };

  // Упрощаем handleDeleteEvent и handleDuplicateEvent, так как TaskForm теперь принимает только id
  const handleDeleteEventFromForm = async (id: string) => {
    try {
      await deleteTask(id);
      onDataChange();
      handleCloseForm(); // Закрываем форму после удаления
    } catch (error) {
      console.error(`Ошибка при удалении задачи:`, error);
      // Можно показать toast с ошибкой
    }
  };

  const handleDuplicateEventFromForm = async (id: string) => {
    try {
      await duplicateTask(id);
      onDataChange();
      handleCloseForm(); // Закрываем форму после дублирования
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
      <div className="add-task-button-container">
        <button className="add-event-button" onClick={(e) => { e.stopPropagation(); handleOpenForm(); }}>+</button>
      </div>
    </div>
  );

  return (
    <div ref={dropRef} className={`${dayColumnClassName} ${isOver ? 'highlighted-drop-zone' : ''}`}>
      {dayHeader}
      <div className="tasks-list-container">
        {events.length > 0 ? (
          events.map((event) => {
            // Определяем ключ: используем 'id' если это Task, иначе 'uuid' (для Note)
            const key = (event as Task).id ? (event as Task).id : (event as Note).uuid;
            return (
              <MiniEventCard
                key={key}
                event={event}
                onEdit={handleOpenForm}
              />
            );
          })
        ) : (
          <div className="empty-day-placeholder">Нет событий</div>
        )}
      </div>
      {showForm && editingEvent && (
        <TaskForm
          initialData={editingEvent}
          onTaskSaved={() => { // onTaskSaved из TaskForm теперь не передает данные задачи напрямую
            onDataChange(); // Просто обновляем данные в DayColumn
            handleCloseForm();
          }}
          onClose={handleCloseForm}
          onDelete={editingEvent.id ? handleDeleteEventFromForm : undefined}
          onDuplicate={editingEvent.id ? handleDuplicateEventFromForm : undefined}
        />
      )}
    </div>
  );
};

export default React.memo(DayColumn);
