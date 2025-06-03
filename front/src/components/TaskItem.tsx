import { faClone } from '@fortawesome/free-solid-svg-icons/faClone';
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';
import type { Task } from '../services/api'; // Исправлен путь импорта Task и добавлен type
import './TaskItem.css';

interface TaskItemProps {
  task: Task; // Замена пропсов на один проп task типа Task
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onEdit: (task: Task) => void; // Тип параметра task изменен на Task
}

const ItemTypes = {
  TASK: 'task',
};

const TaskItem: React.FC<TaskItemProps> = ({ task, onDelete, onDuplicate, onEdit }) => { // Деструктуризация task и колбэков

  // Деструктуризация полей из task. dueDate и comments пока не используются в JSX, но доступны для логики.
  // TODO: Implement or remove unused variable/prop
  const { uuid: id, type, title, amountEarned, amountSpent, expenseCategoryName } = task;

  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    // Передаем объект task целиком, так как он уже содержит все необходимые поля
    item: task,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  // Зависимости хука useDrag обновлены для отражения использования объекта task
  }), [task]);

  drag(ref);

  const handleEditClick = () => {
    onEdit(task); // Передаем весь объект task в onEdit
  };

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (window.confirm('Вы уверены, что хотите удалить это дело?')) {
      onDelete(id || ''); // Используем деструктурированный id
    }
  };

  return (
    <div
      ref={ref}
      className={`TaskItemContainer ${isDragging ? 'dragging' : ''} ${type}`} // Используем деструктурированный type
      onClick={handleEditClick}
    >
      <div className="TaskItemMainContent">
        <div className="TaskInfoContainer">
          <h4 className="TaskTitle">{title}</h4> {/* Используем деструктурированный title */}
          <p className="TaskDetail">
            {/* Используем деструктурированные type, amountEarned, amountSpent */}
            {type === 'income' ? `+${amountEarned || 0}₽` : `-${amountSpent || 0}₽`}
            {type === 'expense' && expenseCategoryName && (
              <span className="ExpenseCategoryName"> ({expenseCategoryName})</span>
            )}
          </p>
        </div>
        <div className="ButtonContainer">
          <button className="btn btn-icon ActionButton delete" onClick={handleDeleteClick}>
            <FontAwesomeIcon icon={faTrash} />
          </button>
          {/* Используем деструктурированный id для onDuplicate */}
          <button className="btn btn-icon ActionButton duplicate" onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onDuplicate(id || ''); }}>
            <FontAwesomeIcon icon={faClone} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TaskItem);
