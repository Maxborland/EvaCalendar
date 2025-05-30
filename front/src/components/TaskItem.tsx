import { faClone } from '@fortawesome/free-solid-svg-icons/faClone';
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';
import './TaskItem.css';

interface TaskItemProps {
  id: string;
  type: 'income' | 'expense';
  title?: string;
  time?: string;
  address?: string;
  childId?: string; // Изменено с childName на childId
  childName?: string; // Оставлено для отображения
  hourlyRate?: number;
  comments?: string;
  category?: string;
  amountEarned?: number;
  amountSpent?: number;
  hoursWorked?: number; // Новое поле для часов работы
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onEdit: (task: any) => void;
}

const ItemTypes = {
  TASK: 'task',
};






const TaskItem: React.FC<TaskItemProps> = (props) => {
  const {
    id,
    type,
    title,
    time,
    address,
    childName,
    hourlyRate,
    comments,
    category,
    amountEarned,
    amountSpent,
    hoursWorked,
    onDelete,
    onDuplicate,
    onEdit,
  } = props;

  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id, type, title, time, address, childId: props.childId, childName, hourlyRate, comments, category, amountEarned, amountSpent, hoursWorked }, // Изменено childName на childId
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [id, type, title, time, address, childName, hourlyRate, comments, category, amountEarned, amountSpent, hoursWorked]);

  drag(ref);

  const handleEditClick = () => {
    onEdit({
      id,
      type,
      title,
      time,
      address,
      childId: props.childId, // Изменено childName на childId
      childName,
      hourlyRate,
      comments,
      category,
      amountEarned,
      amountSpent,
      hoursWorked,
    });
  };

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (window.confirm('Вы уверены, что хотите удалить это дело?')) {
      onDelete(id || '');
    }
  };

  return (
    <div
      ref={ref}
      className={`TaskItemContainer ${isDragging ? 'dragging' : ''} ${type}`}
      onClick={handleEditClick}
    >
      <div className="TaskItemMainContent">
        <div className="TaskInfoContainer">
          <h4 className="TaskTitle">{title}</h4>
          <p className="TaskDetail">
            {type === 'income' ? `+${amountEarned || 0}₽` : `-${amountSpent || 0}₽`}
          </p>
        </div>
        <div className="ButtonContainer">
          <button className="ActionButton delete" onClick={handleDeleteClick}>
            <FontAwesomeIcon icon={faTrash} />
          </button>
          <button className="ActionButton duplicate" onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onDuplicate(id || ''); }}>
            <FontAwesomeIcon icon={faClone} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TaskItem);
