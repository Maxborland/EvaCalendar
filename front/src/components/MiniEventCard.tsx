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


  let eventText = '';

  if (event.itemType === 'task' && 'type' in event) {
    const task = event as Task;
    if (task.type === 'income' || task.type === 'fixed' || task.type === 'hourly') {
      eventText = `${task.time ? task.time + ' ' : ''}${task.childName || task.title || 'Доход'}${task.amount ? ` (${task.amount.toFixed(2)})` : ''}`;
    } else if (task.type === 'expense') { // Это условие должно быть здесь, если itemType === 'task' может быть расходом
      eventText = `${task.title || 'Расход'}${task.amount ? ` (${task.amount.toFixed(2)})` : ''}${task.expenseCategoryName ? ` [${task.expenseCategoryName}]` : ''}`;
    } else {
      eventText = `${task.time ? task.time + ' ' : ''}${task.title || 'Задача'}`;
    }
  } else if (event.itemType === 'expense') { // Если itemType сам по себе 'expense' (на случай если 'type' в Task не используется для расходов)
    const expense = event as Task;
    eventText = `${expense.title || 'Расход'}${expense.amount ? ` (${expense.amount.toFixed(2)})` : ''}${expense.expenseCategoryName ? ` [${expense.expenseCategoryName}]` : ''}`;
  } else if (event.itemType === 'note') {
    const note = event as Note;
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
      <span className="truncate">{eventText}</span>
    </div>
  );
};

export default React.memo(MiniEventCard);