import React, { useEffect, useRef, useState } from 'react'; // useCallback удален, так как fetchTasks удаляется
import { useDrop, type DropTargetMonitor } from 'react-dnd';
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

  const isToday = isSameDay(fullDate, today);
  // Обновляем класс для соответствия макету (фон для today)
  const dayColumnClassName = `day-column ${isToday ? 'today' : ''}`;


  const { setIsNavVisible, setIsModalOpen } = useNav();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState< (Partial<Task> & { type: 'income' | 'expense' }) | undefined >(undefined);


  useEffect(() => {
    const taskEvents: EventItem[] = tasksForDay.map(task => ({
      ...task,
      // Если task.type из API это 'expense', то itemType будет 'expense', иначе 'task'.
      // Это соответствует EventItem.itemType: 'task' | 'note' | 'expense'
      itemType: task.type === 'expense' ? 'expense' : 'task',
    }));
    // Заметки (notesForDay) больше не добавляются в список событий для DayColumn.
    // const noteEvents: EventItem[] = notesForDay.map(note => ({
    //   ...note,
    //   itemType: 'note',
    // }));
    // TODO: Добавить сортировку событий по времени (если это еще актуально только для задач)
    // Реализация сортировки согласно плану MINI_CARD_SORTING_PLAN.md
    const incomeEvents: EventItem[] = [];
    const expenseEvents: EventItem[] = [];

    taskEvents.forEach(event => {
      // Предполагаем, что event здесь всегда имеет структуру Task, так как notesForDay не используются
      const task = event as Task;
      // Определение "дохода" и "расхода" согласно плану
      const isIncome = task.type !== 'expense' && typeof task.time === 'string' && /^\d{2}:\d{2}$/.test(task.time);
      const isExpense = task.type === 'expense';

      if (isIncome) {
        incomeEvents.push(event);
      } else if (isExpense) {
        expenseEvents.push(event);
      } else {
        // Если это не доход и не расход (например, задача без времени, но не expense),
        // пока добавляем к расходам, чтобы сохранить их в конце списка.
        // Это поведение можно будет уточнить.
        expenseEvents.push(event);
      }
    });

    // Сортировка "доходов" по времени
    incomeEvents.sort((a, b) => {
      const taskA = a as Task;
      const taskB = b as Task;
      // Убедимся, что time существует и является строкой (хотя проверка isIncome уже это делает)
      if (taskA.time && taskB.time) {
        return taskA.time.localeCompare(taskB.time);
      }
      return 0; // Если время отсутствует, не меняем порядок
    });

    const sortedEvents = [...incomeEvents, ...expenseEvents];
    setEvents(sortedEvents);
  }, [tasksForDay, fullDate]); // Удалена зависимость notesForDay

  const handleOpenForm = (eventToEdit?: EventItem) => {
    // EventItem.itemType может быть 'task', 'note', 'expense'. 'income' здесь не проверяем.
    if (eventToEdit && (eventToEdit.itemType === 'task' || eventToEdit.itemType === 'expense')) {
      const taskToEdit = eventToEdit as Task; // eventToEdit здесь точно является Task

      // TaskForm ожидает initialData.type как 'income' или 'expense'.
      // Если оригинальный task.type это 'expense', передаем 'expense'.
      // Для всех остальных типов задач (например, 'fixed', 'hourly'), считаем их 'income' для формы.
      if (taskToEdit.type === 'expense') {
        setEditingEvent({ ...taskToEdit, type: 'expense' });
      } else {
        setEditingEvent({ ...taskToEdit, type: 'income' });
      }
    } else if (!eventToEdit) { // Создание новой задачи (по кнопке "+ Добавить дело")
      setEditingEvent({
        type: 'income', // Тип по умолчанию для новой задачи
        title: '',
        dueDate: createDate(props.fullDate).toISOString().slice(0, 10),
      });
    } else {
      // Если это заметка или другой тип, который не редактируется через TaskForm, ничего не делаем
      // или открываем другую форму (пока не реализовано)
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

  // Обновляем handleDeleteTask и handleDuplicateTask для работы с EventItem
  const handleDeleteEvent = async (id: string, itemType: 'task' | 'note' | 'expense') => {
    try {
      // 'income' не является значением itemType для EventItem
      if (itemType === 'task' || itemType === 'expense') {
        await deleteTask(id);
      } else if (itemType === 'note') {
        // await deleteNote(id); // TODO: Реализовать deleteNote в api.ts если нужно
        console.warn(`Deletion for notes (id: ${id}) not implemented yet.`);
      }
      onDataChange();
    } catch (error) {
      console.error(`Ошибка при удалении ${itemType}:`, error);
    }
  };

  const handleDuplicateEvent = async (id: string, itemType: 'task' | 'note' | 'expense') => {
    try {
      // 'income' не является значением itemType для EventItem
      if (itemType === 'task' || itemType === 'expense') {
        await duplicateTask(id);
      } else {
        console.warn(`Duplication for ${itemType} (id: ${id}) not implemented yet.`);
      }
      onDataChange();
    } catch (error) {
      console.error(`Ошибка при дублировании ${itemType}:`, error);
    }
  };


  const handleMoveEvent = async (eventId: string, itemType: string, newDueDate: string) => {
    if (itemType === 'task' || itemType === 'income' || itemType === 'expense') {
      try {
        await moveTask(eventId, newDueDate);
        onDataChange();
      } catch (error) {
        console.error('Ошибка при перемещении задачи:', error);
      }
    } else {
      console.warn(`Moving for ${itemType} (id: ${eventId}) not implemented yet.`);
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

  // Новый стиль заголовка дня согласно макету
  const dayHeader = (
    <div className={`day-header ${isToday ? 'today-header-highlight' : ''}`}>
      <span className="day-name">{formatDateForDayColumnHeader(fullDate)}</span>
    </div>
  );


  return (
    <div ref={dropRef} className={`${dayColumnClassName} ${isOver ? 'highlighted-drop-zone' : ''}`}>
      {dayHeader}
      <div className="tasks-list-container"> {/* Контейнер для списка задач с прокруткой */}
        {events.length > 0 ? (
          events.map((event) => (
            <MiniEventCard
              key={event.uuid || (event as Note).uuid} // Используем uuid для Task и Note
              event={event}
              onEdit={handleOpenForm} // handleOpenForm теперь принимает EventItem
            />
          ))
        ) : (
          <div className="empty-day-placeholder">Нет событий</div>
        )}
      </div>
      {/* Контейнер для кнопки добавления задачи */}
      <div className="add-task-button-container">
        <button className="add-event-button" onClick={() => handleOpenForm()}>+</button>
      </div>
      {/* TaskForm отображается модально и не влияет на основной поток */}
      {showForm && editingEvent && (editingEvent.type === 'income' || editingEvent.type === 'expense') && (
        <TaskForm
          initialData={editingEvent}
          onTaskSaved={() => {
            onDataChange();
            setIsNavVisible(true); // Возвращаем видимость навигации
            handleCloseForm(); // Закрываем форму после сохранения
          }}
          onClose={handleCloseForm}
          onDelete={editingEvent.uuid ? handleDeleteEvent : undefined} // Передаем onDelete если редактируем
          onDuplicate={editingEvent.uuid ? handleDuplicateEvent : undefined} // Передаем onDuplicate если редактируем
        />
      )}
    </div>
  );
};

export default React.memo(DayColumn);
