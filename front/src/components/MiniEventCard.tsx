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


  let displayTime = '&nbsp;';
  let eventTitleText = '';

  if (event.itemType === 'task' && 'type' in event) {
    const task = event as Task;
    if (task.time) {
      displayTime = task.time;
    }
    if (task.type === 'income' || task.type === 'fixed' || task.type === 'hourly') {
      eventTitleText = `${task.childName || task.title || 'Доход'}${task.amount ? ` (${task.amount.toFixed(2)})` : ''}`;
    } else if (task.type === 'expense') {
      eventTitleText = `${task.title || 'Расход'}${task.amount ? ` (${task.amount.toFixed(2)})` : ''}${task.expenseCategoryName ? ` [${task.expenseCategoryName}]` : ''}`;
    } else {
      eventTitleText = task.title || 'Задача';
    }
  } else if (event.itemType === 'expense') {
    const expense = event as Task;
    // Для расходов время обычно не указывается, оставляем &nbsp;
    eventTitleText = `${expense.title || 'Расход'}${expense.amount ? ` (${expense.amount.toFixed(2)})` : ''}${expense.expenseCategoryName ? ` [${expense.expenseCategoryName}]` : ''}`;
  } else if (event.itemType === 'note') {
    const note = event as Note;
    // Для заметок время обычно не указывается, оставляем &nbsp;
    eventTitleText = note.content || 'Заметка';
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
      className={`bg-gray-700 p-2 rounded-md border-l-4 ${borderColorClass} flex items-center text-sm ${isDragging ? 'opacity-50' : ''}`}
      onClick={handleEditClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleEditClick()}
    >
      <div className="w-12 flex-shrink-0 pr-2 text-left border-r border-gray-600">
        {displayTime === '&nbsp;' ? <span dangerouslySetInnerHTML={{ __html: '&nbsp;' }} /> : displayTime}
      </div>
      <div className="flex-grow pl-2 truncate">
        {eventTitleText}
      </div>
    </div>
  );
};

export default React.memo(MiniEventCard);