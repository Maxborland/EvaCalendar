import type { Moment } from 'moment';
import React, { useEffect, useRef, useState } from 'react'; // useCallback удален, так как fetchTasks удаляется
import { useDrop, type DropTargetMonitor } from 'react-dnd';
import { useNav } from '../context/NavContext';
import { deleteTask, duplicateTask, moveTask, type Note, type Task } from '../services/api'; // getTasksByWeekAndDay удален, Task и Note импортированы
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
  fullDate: Moment;
  today: Moment;
  tasksForDay: Task[];
  notesForDay: Note[]; // Добавляем заметки для дня
  onTaskMove: () => void; // Переименуем в onDataChange для общности
}

const DayColumn: React.FC<DayColumnProps> = (props) => {
  const { fullDate, today, tasksForDay, notesForDay, onTaskMove: onDataChange } = props;

  const isToday = fullDate.isSame(today, 'day');
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
    setEvents([...taskEvents]); // Теперь только taskEvents
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
        dueDate: props.fullDate.format('YYYY-MM-DD'),
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
        handleMoveEvent(item.id, item.itemType, props.fullDate.format('YYYY-MM-DD'));
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
      <span className="day-name">{fullDate.clone().locale('ru').format('dddd')} {fullDate.clone().locale('ru').format('D MMMM')}</span>
    </div>
  );


  return (
    <div ref={dropRef} className={`${dayColumnClassName} ${isOver ? 'highlighted-drop-zone' : ''}`}>
      {dayHeader}
      <div className="day-events-list"> {/* Контейнер для карточек с возможностью прокрутки */}
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
      {/* Кнопка "Добавить дело" с новым классом для стилизации */}
      <button className="add-event-button" onClick={() => handleOpenForm()}>+ Добавить дело</button>
    </div>
  );
};

export default React.memo(DayColumn);