import { faMinus } from '@fortawesome/free-solid-svg-icons/faMinus';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';
import type { Note, Task } from '../services/api'; // Предполагаем, что типы Task и Note импортируются отсюда
import './MiniEventCard.css'; // CSS файл для стилей

// Объединенный тип для события, которое может быть задачей или заметкой
// В будущем можно будет расширить для расходов, если они будут иметь другую структуру
export type EventItem = (Task | Note) & { itemType: 'task' | 'note' | 'expense', type?: string, childName?: string, amount?: number }; // Добавим itemType для различения и опциональные поля для дохода

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
    item: () => { // Оборачиваем в функцию для ленивого вычисления
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
  }), [event]); // Зависимость от event

  drag(ref);

  const handleEditClick = () => {
    onEdit(event);
  };

  const renderContent = () => {
    // Проверяем, является ли событие задачей (Task) для доступа к ее полям
    if ('title' in event) { // Простой способ проверить, есть ли у объекта поле title (характерно для Task)
      const task = event as Task; // Теперь TypeScript знает, что это Task

      // Логика для отображения дохода (income), расхода (expense) или обычной задачи (task)
      if (task.type === 'income' || task.type === 'fixed' || task.type === 'hourly') { // 'fixed' и 'hourly' тоже доходы
        return (
          <>
            <div className="card-icon">
              <FontAwesomeIcon icon={faPlus} />
            </div>
            <div className="income-meta">
              {task.time && <span className="card-time">{task.time}</span>}
            </div>
            <div className="card-details">
              <div className="card-title-wrapper">
                <span className="card-title">{task.childName || task.title}</span>
                {task.amount !== undefined && <span className="card-amount"> ({task.amount?.toFixed(2)})</span>}
              </div>
            </div>
          </>
        );
      } else if (task.type === 'expense') {
        return (
          <>
            <div className="card-icon">
              <FontAwesomeIcon icon={faMinus} />
            </div>
            <div className="card-details">
              <div className="card-title-wrapper">
                 <h4 className="card-title">{task.title}</h4>
                 {task.amount !== undefined && <span className="card-amount"> ({task.amount?.toFixed(2)})</span>}
              </div>
              {task.expenseCategoryName && (
                <p className="card-category">({task.expenseCategoryName})</p>
              )}
            </div>
          </>
        );
      } else { // Обычная задача без явного дохода/расхода (если такие будут)
         return (
          <>
            {/* Можно добавить иконку по умолчанию для задач */}
            <div className="card-details">
              <div className="card-title-wrapper">
                <h4 className="card-title">{task.title}</h4>
              </div>
            </div>
          </>
        );
      }
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

  // Определяем класс для income-card-style более точно
  const isIncomeType = 'type' in event && (event.type === 'income' || event.type === 'fixed' || event.type === 'hourly');

  return (
    <div
      ref={ref}
      className={`mini-event-card ${event.itemType} ${isDragging ? 'dragging' : ''} ${isIncomeType ? 'income-card-style' : ''}`}
      onClick={handleEditClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleEditClick()}
    >
      <div className="card-main-content">
        {renderContent()}
      </div>
      {/* Убираем color-stripe, так как поле category удалено из Task */}
      {/* {(event.itemType === 'task' || event.itemType === 'expense') && (event as Task).category_id && (
        <div className={`color-stripe ${(event as Task).category_id || 'default'}`}></div>
      )} */}
    </div>
  );
};

export default React.memo(MiniEventCard);