import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';
import type { Note, Task } from '../services/api';

export type EventItem = (Task | Note) & { itemType: 'task' | 'note' | 'expense', type?: string, childName?: string, amount?: number, time?: string, title?: string, content?: string, expenseCategoryName?: string };

interface MiniEventCardProps {
  event: EventItem;
  onEdit: (event: EventItem) => void;
}

const ItemTypes = {
  EVENT_CARD: 'event_card',
};

const MiniEventCard: React.FC<MiniEventCardProps> = ({
  event,
  onEdit,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.EVENT_CARD,
    item: () => {
      const itemId = event.itemType === 'note' ? (event as Note).uuid : (event as Task).uuid;
      return {
        id: itemId,
        itemType: event.itemType,
        originalEvent: event,
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [event]);

  drag(ref);

  const handleEditClick = () => {
    onEdit(event);
  };

  // Иконка и текст события согласно макету
  // docs/new_design_main_page.html строки 91-98
  // <div class="bg-gray-700 p-2 rounded-md border-l-2 border-green-custom flex items-center text-sm">
  //   <span class="material-icons text-xs mr-1 text-green-400">add</span>
  //   11:16 Хер
  // </div>

  // let eventIcon = 'event'; // Иконка по умолчанию - УДАЛЕНО
  let eventText = '';
  // let iconColorClass = 'text-green-400'; // По умолчанию зеленый для "дохода" или общей задачи - УДАЛЕНО

  // Проверяем, является ли событие задачей и какого типа
  if (event.itemType === 'task' && 'type' in event) {
    const task = event as Task;
    if (task.type === 'income' || task.type === 'fixed' || task.type === 'hourly') {
      // eventIcon = 'add'; // Иконка для дохода - УДАЛЕНО
      // iconColorClass = 'text-green-400'; - УДАЛЕНО
      eventText = `${task.time ? task.time + ' ' : ''}${task.childName || task.title || 'Доход'}${task.amount ? ` (${task.amount.toFixed(2)})` : ''}`;
    } else if (task.type === 'expense') { // Это условие должно быть здесь, если itemType === 'task' может быть расходом
      // eventIcon = 'remove'; // Иконка для расхода - УДАЛЕНО
      // iconColorClass = 'text-red-400'; - УДАЛЕНО
      eventText = `${task.title || 'Расход'}${task.amount ? ` (${task.amount.toFixed(2)})` : ''}${task.expenseCategoryName ? ` [${task.expenseCategoryName}]` : ''}`;
    } else { // Обычная задача без явного типа дохода/расхода
      // eventIcon = 'task'; // Иконка для обычной задачи - УДАЛЕНО
      // iconColorClass = 'text-blue-400'; - УДАЛЕНО
      eventText = `${task.time ? task.time + ' ' : ''}${task.title || 'Задача'}`;
    }
  } else if (event.itemType === 'expense') { // Если itemType сам по себе 'expense' (на случай если 'type' в Task не используется для расходов)
    const expense = event as Task;
    // eventIcon = 'remove'; // Для расходов - УДАЛЕНО
    // iconColorClass = 'text-red-400'; // Красный для расходов - УДАЛЕНО
    eventText = `${expense.title || 'Расход'}${expense.amount ? ` (${expense.amount.toFixed(2)})` : ''}${expense.expenseCategoryName ? ` [${expense.expenseCategoryName}]` : ''}`;
  } else if (event.itemType === 'note') {
    const note = event as Note;
    // eventIcon = 'notes'; // Иконка для заметок - УДАЛЕНО
    // iconColorClass = 'text-yellow-400'; // Желтый для заметок - УДАЛЕНО
    eventText = note.content || 'Заметка';
  }

  let borderColorClass = 'border-gray-300';
  if (event.itemType === 'task' && 'type' in event) {
    const task = event as Task;
    if (task.type === 'income') {
      borderColorClass = 'border-green-500';
    } else if (task.type === 'expense') {
      borderColorClass = 'border-red-500';
    }
  } else if (event.itemType === 'expense') {
    borderColorClass = 'border-red-500';
  }

  return (
    <div
      ref={ref}
      className={`bg-gray-700 p-2 rounded-md border-l-2 ${borderColorClass} flex items-center text-sm ${isDragging ? 'opacity-50' : ''}`}
      onClick={handleEditClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleEditClick()}
    >
      {/* <span className={`material-icons text-xs mr-1 ${iconColorClass}`}>{eventIcon}</span> - УДАЛЕНО */}
      <span className="truncate">{eventText}</span>
    </div>
  );
};

export default React.memo(MiniEventCard);