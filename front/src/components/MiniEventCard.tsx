import { faMinus } from '@fortawesome/free-solid-svg-icons/faMinus';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';
import type { Note, Task } from '../services/api'; // Предполагаем, что типы Task и Note импортируются отсюда
import './MiniEventCard.css'; // CSS файл для стилей

// Объединенный тип для события, которое может быть задачей или заметкой
// В будущем можно будет расширить для расходов, если они будут иметь другую структуру
export type EventItem = (Task | Note) & { itemType: 'task' | 'note' | 'expense', type?: string, child_name?: string, amount?: number }; // Добавим itemType для различения и опциональные поля для дохода

interface MiniEventCardProps {
  event: EventItem;
  onEdit: (event: EventItem) => void;
  // Другие props, если понадобятся, например, для drag-n-drop
}

const ItemTypes = {
  EVENT_CARD: 'event_card', // Тип для dnd
};

const MiniEventCard: React.FC<MiniEventCardProps> = ({
  event,
  onEdit,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.EVENT_CARD,
    item: {
      // Используем uuid для обоих типов, если Note также имеет uuid
      id: event.itemType === 'note' ? (event as Note & { uuid: string }).uuid : (event as Task).uuid,
      itemType: event.itemType,
      originalEvent: event
    }, // Передаем ID и тип для dnd
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [event]);

  drag(ref);

  const handleEditClick = () => {
    onEdit(event);
  };

  // Рендеринг в зависимости от типа события (Task, Expense, Note)
  const renderContent = () => {
    if (event.itemType === 'task' || event.itemType === 'expense' || event.type === 'income') { // Добавлена проверка event.type === 'income'
      const task = event as Task; // Приводим к типу Task для доступа к полям задачи/расхода/дохода

      if (task.type === 'income') {
        return (
          <>
            <div className="card-icon">
              <span>{task.type === 'income' ? <FontAwesomeIcon icon={faPlus} /> : <FontAwesomeIcon icon={faMinus} />}</span>
            </div>
            <div className="card-details">
              <div className="card-title-wrapper">
                <span className="card-title">{task.child_name || task.title}</span> {/* Имя ребенка или заголовок */}
              </div>
              <div className="income-meta">
                {task.time && <span className="card-time">{task.time}</span>}
                {task.amountEarned != null && ( // Используем amountEarned для суммы дохода
                  <span className="card-amount income">+{task.amountEarned}₽</span>
                )}
              </div>
            </div>
          </>
        );
      }

      return (
        <>
          <div className="card-icon">
            <span>{task.type === 'expense' ? <FontAwesomeIcon icon={faMinus} /> : <FontAwesomeIcon icon={faPlus} />}</span>
          </div>
          <div className="card-details">
            <div className="card-title-wrapper">
              <h4 className="card-title">{task.title}</h4>
            </div>
            <div className="expense-meta">
              {task.type === 'expense' && task.expenseCategoryName && (
                <p className="card-category">({task.expenseCategoryName})</p>
              )}
              {(task.type === 'expense' && task.amountSpent != null) && (
                <span className="card-amount expense">-{task.amountSpent}₽</span>
              )}

            </div>
          </div>
        </>
      );
    } else if (event.itemType === 'note') {
      const note = event as Note;
      return (
        <>
          <div className="card-icon"><span>📝</span></div>
          <div className="card-details">
            <p className="card-note-text">{note.content}</p>
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div
      ref={ref}
      className={`mini-event-card ${event.itemType} ${isDragging ? 'dragging' : ''} ${(event as Task).type === 'income' ? 'income-card-style' : ''}`}
      onClick={handleEditClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleEditClick()}
    >
      <div className="card-main-content">
        {renderContent()}
      </div>
      {/* Опциональная цветовая полоска для задач */}
      {(event.itemType === 'task' || event.itemType === 'expense') && (event as Task).category && (
        <div className={`color-stripe ${(event as Task).category || 'default'}`}></div>
      )}
    </div>
  );
};

export default React.memo(MiniEventCard);