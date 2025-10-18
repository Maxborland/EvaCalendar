import clsx from 'clsx';
import { memo, useMemo, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { useAuth } from '../context/AuthContext';
import type { Note, Task } from '../services/api';
import './MiniEventCard.css';

export type EventItem = (Task | Note) & {
  itemType: 'task' | 'note' | 'expense';
  type?: string;
  childName?: string;
  amount?: number;
  time?: string;
  title?: string;
  content?: string;
  expenseCategoryName?: string;
};

interface MiniEventCardProps {
  event: EventItem;
  onEdit: (event: EventItem) => void;
}

const ItemTypes = {
  EVENT_CARD: 'event_card',
};

const MiniEventCard = ({ event, onEdit }: MiniEventCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ItemTypes.EVENT_CARD,
      item: () => {
        const itemId =
          event.itemType === 'note'
            ? (event as Note).uuid
            : (event as Task).uuid;

        return {
          id: itemId,
          itemType: event.itemType,
          originalEvent: event,
        };
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [event]
  );

  drag(ref);

  const handleEditClick = () => {
    onEdit(event);
  };

  const displayTime = useMemo(() => {
    if (event.itemType !== 'task') {
      return null;
    }
    const task = event as Task;
    if (task.time && /^\d{2}:\d{2}$/.test(task.time)) {
      return task.time;
    }
    return null;
  }, [event]);

  const eventTitle = useMemo(() => {
    if (event.itemType === 'task' && 'type' in event) {
      const task = event as Task;
      switch (task.type) {
        case 'income':
        case 'fixed':
        case 'hourly': {
          const amountText =
            typeof task.amount === 'number'
              ? ` · ${task.amount.toFixed(2)} ₽`
              : '';
          return `${task.title || task.childName || 'Доход'}${amountText}`;
        }
        case 'expense': {
          const amountText =
            typeof task.amount === 'number'
              ? ` · ${task.amount.toFixed(2)} ₽`
              : '';
          const categoryText = task.expenseCategoryName
            ? ` · ${task.expenseCategoryName}`
            : '';
          return `${task.title || 'Расход'}${amountText}${categoryText}`;
        }
        case 'task': {
          const assigneeName = task.assignee?.username;
          return `${task.title || 'Задача'}${
            assigneeName ? ` → ${assigneeName}` : ''
          }`;
        }
        case 'lesson': {
          const shortAddress =
            task.address && task.address.length > 18
              ? `${task.address.substring(0, 18)}…`
              : task.address || '';
          return `${task.title || 'Занятие'}${shortAddress ? ` · ${shortAddress}` : ''}`;
        }
        default:
          return task.title || 'Задача';
      }
    }

    if (event.itemType === 'expense') {
      const expense = event as Task;
      const amountText =
        typeof expense.amount === 'number'
          ? ` · ${expense.amount.toFixed(2)} ₽`
          : '';
      const categoryText = expense.expenseCategoryName
        ? ` · ${expense.expenseCategoryName}`
        : '';
      return `${expense.title || 'Расход'}${amountText}${categoryText}`;
    }

    if (event.itemType === 'note') {
      const note = event as Note;
      return note.content || 'Заметка';
    }

    return '';
  }, [event]);

  const cardVariant = useMemo(() => {
    if (event.itemType === 'note') return 'note';
    if (event.itemType === 'expense') return 'expense';
    if (event.itemType === 'task' && 'type' in event) {
      const task = event as Task;
      if (task.type === 'expense') return 'expense';
      if (task.type === 'lesson') return 'lesson';
      if (task.type === 'income' || task.type === 'fixed' || task.type === 'hourly') {
        return 'income';
      }
    }
    return 'task';
  }, [event]);

  const ownershipBadge = useMemo(() => {
    if (event.itemType !== 'task' || !user) return null;
    const task = event as Task;
    if (task.creator?.uuid === user.uuid && task.assignee?.uuid !== user.uuid) {
      return 'badge-delegated';
    }
    if (task.assignee?.uuid === user.uuid) {
      return 'badge-assigned';
    }
    return null;
  }, [event, user]);

  const handleKeyDown = (keyboardEvent: React.KeyboardEvent<HTMLDivElement>) => {
    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
      keyboardEvent.preventDefault();
      handleEditClick();
    }
  };

  return (
    <div
      ref={ref}
      className={clsx('mini-card', `mini-card--${cardVariant}`, {
        'mini-card--dragging': isDragging,
      })}
      onClick={handleEditClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={eventTitle}
    >
      <div className="mini-card__accent" />
      <div className="mini-card__time">
        {displayTime ? (
          <span className="mini-card__time-text">{displayTime}</span>
        ) : (
          <span className="mini-card__time-placeholder" aria-hidden="true">
            •
          </span>
        )}
      </div>
      <div className="mini-card__body">
        <span className="mini-card__title">{eventTitle}</span>
        {ownershipBadge && (
          <span className={clsx('mini-card__badge', ownershipBadge)} />
        )}
      </div>
    </div>
  );
};

export default memo(MiniEventCard);