import clsx from 'clsx';
import type { CSSProperties } from 'react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useDrag } from 'react-dnd';
import { useAuth } from '../context/AuthContext';
import type { Note, Task } from '../services/api';

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
  onMoveToDay?: (eventId: string, dayLabel: string) => void;
  availableDays?: { label: string; dateString: string }[];
}

const ItemTypes = {
  EVENT_CARD: 'event_card',
};

const VARIANT_STYLES: Record<string, CSSProperties> = {
  income: {
    background: 'linear-gradient(135deg, var(--color-income-bg) 0%, var(--surface-glass) 100%)',
    borderColor: 'var(--color-income-border)',
  },
  expense: {
    background: 'linear-gradient(135deg, var(--color-expense-bg) 0%, var(--surface-glass) 100%)',
    borderColor: 'var(--color-expense-border)',
  },
  lesson: {
    background: 'linear-gradient(135deg, var(--color-lesson-bg) 0%, var(--surface-glass) 100%)',
    borderColor: 'var(--color-lesson-border)',
  },
  task: {
    background: 'linear-gradient(135deg, var(--color-task-bg) 0%, var(--surface-glass) 100%)',
    borderColor: 'var(--color-task-border)',
  },
  note: {
    background: 'var(--surface-glass)',
    borderColor: 'var(--color-border-subtle)',
  },
};

const ACCENT_STYLES: Record<string, CSSProperties> = {
  income: { background: 'linear-gradient(180deg, var(--color-income-primary), rgba(72, 187, 120, 0.2))' },
  expense: { background: 'linear-gradient(180deg, var(--color-expense-primary), rgba(232, 93, 117, 0.2))' },
  lesson: { background: 'linear-gradient(180deg, var(--color-lesson-primary), rgba(96, 165, 250, 0.2))' },
  task: { background: 'linear-gradient(180deg, var(--color-task-primary), rgba(167, 139, 250, 0.2))' },
  note: { background: 'linear-gradient(180deg, rgba(229, 234, 247, 0.5), rgba(229, 234, 247, 0.12))' },
};

const MiniEventCard = ({ event, onEdit, onMoveToDay, availableDays }: MiniEventCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchMoved = useRef(false);

  const handleTouchStart = useCallback(() => {
    touchMoved.current = false;
    longPressTimer.current = setTimeout(() => {
      if (!touchMoved.current && onMoveToDay && availableDays) {
        setShowMoveMenu(true);
      }
    }, 500);
  }, [onMoveToDay, availableDays]);

  const handleTouchMove = useCallback(() => {
    touchMoved.current = true;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

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
      return 'delegated';
    }
    if (task.assignee?.uuid === user.uuid) {
      return 'assigned';
    }
    return null;
  }, [event, user]);

  const handleKeyDown = (keyboardEvent: React.KeyboardEvent<HTMLDivElement>) => {
    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
      keyboardEvent.preventDefault();
      handleEditClick();
    }
  };

  const eventId = (event as Task).uuid || (event as Note).uuid;

  return (
    <div
      ref={ref}
      style={VARIANT_STYLES[cardVariant]}
      className={clsx(
        'relative grid grid-cols-[6px_minmax(0,1fr)] auto-rows-auto gap-x-2.5 p-2 rounded-[14px] border backdrop-blur-[16px] shadow-glass cursor-pointer',
        'transition-[transform,box-shadow,border-color,background-color] duration-[160ms]',
        'hover:-translate-y-0.5 hover:shadow-elevation-2 hover:border-border-strong hover:bg-surface-raised',
        'active:translate-y-0 active:shadow-glass',
        'min-[480px]:grid-cols-[6px_60px_minmax(0,1fr)] min-[480px]:p-2.5',
        isDragging && 'opacity-55 scale-[0.97]',
      )}
      onClick={showMoveMenu ? undefined : handleEditClick}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="button"
      tabIndex={0}
      aria-label={eventTitle}
    >
      <div className="row-span-2 rounded-full" style={ACCENT_STYLES[cardVariant]} />
      <div className="col-start-2 min-[480px]:col-start-2 min-[480px]:col-end-3 flex items-center gap-1.5 text-xs tracking-wider text-text-tertiary uppercase min-[480px]:justify-start">
        {displayTime ? (
          <span className="font-mono font-semibold text-[0.8125rem] text-text-primary tracking-[0.02em] min-[480px]:text-sm">
            {displayTime}
          </span>
        ) : (
          <span className="opacity-30 text-[0.8rem]" aria-hidden="true">
            •
          </span>
        )}
      </div>
      <div className="col-start-2 min-[480px]:col-start-3 flex items-center gap-2 mt-1">
        <span className="flex-1 min-w-0 text-sm font-semibold leading-tight text-text-primary line-clamp-2 min-[480px]:line-clamp-1 min-[480px]:text-base">
          {eventTitle}
        </span>
        {ownershipBadge && (
          <span
            className={clsx(
              'shrink-0 size-3 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.16)]',
              ownershipBadge === 'delegated' && 'bg-gradient-to-br from-[#ffc107] to-[#ff9800] shadow-[0_2px_6px_rgba(255,193,7,0.4)]',
              ownershipBadge === 'assigned' && 'bg-gradient-to-br from-[#03a9f4] to-[#0288d1] shadow-[0_2px_6px_rgba(3,169,244,0.4)]',
            )}
          />
        )}
      </div>
      {showMoveMenu && availableDays && onMoveToDay && (
        <div
          className="absolute top-full left-0 right-0 z-20 mt-1 p-2 rounded-xl bg-surface-elevated border border-border-strong shadow-elevation-2 flex flex-col gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-xs text-text-tertiary px-2 py-1 font-medium">Переместить в:</div>
          {availableDays.map((day) => (
            <button
              key={day.dateString}
              className="border-none bg-transparent text-text-primary text-sm p-2 rounded-lg cursor-pointer text-left transition-colors duration-[120ms] hover:bg-white/[0.08]"
              onClick={() => {
                onMoveToDay(eventId, day.dateString);
                setShowMoveMenu(false);
              }}
            >
              {day.label}
            </button>
          ))}
          <button
            className="border-none bg-transparent text-text-tertiary text-sm p-2 rounded-lg cursor-pointer text-left transition-colors duration-[120ms] hover:bg-white/[0.08] border-t border-t-border-subtle mt-1 pt-2"
            onClick={() => setShowMoveMenu(false)}
          >
            Отмена
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(MiniEventCard);
