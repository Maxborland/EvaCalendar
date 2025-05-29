import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';
import styled from 'styled-components';

interface TaskItemProps {
  id: string;
  type: 'income' | 'expense';
  title?: string;
  time?: string;
  address?: string;
  childName?: string;
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

const TaskItemContainer = styled.div.attrs<{ isDragging: boolean; itemType: 'income' | 'expense' }>(props => ({
  style: {
    opacity: props.isDragging ? 0.5 : 1,
    borderColor: props.itemType === 'income' ? '#28a745' : '#dc3545', // Зеленый для дохода, красный для расхода
  },
}))`
  background-color: #f9f9f9;
  border: 2px solid; /* Изменяем толщину border */
  border-radius: 8px;
  padding: 5px; /* Уменьшаем padding */
  margin-bottom: 5px; /* Уменьшаем margin-bottom */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: grab;
`;

const TaskTitle = styled.h4`
  margin: 0; /* Убираем все отступы */
  color: #333;
  display: inline-block; /* Для лучшего контроля выравнивания */
  line-height: 1; /* Для более точного выравнивания */
`;

const TaskDetail = styled.p`
  margin: 0; /* Убираем все отступы */
  color: #555;
  font-size: 0.9em;
`;

const TaskInfoContainer = styled.div`
  display: flex;
  align-items: center; /* Выравнивание по центру по вертикали */
  gap: 5px; /* Пространство между элементами */
  flex-grow: 1; /* Позволяет занимать доступное пространство */
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center; /* Выравнивание кнопок по центру */
  gap: 5px;
  margin-top: 0; /* Отступы не нужны, так как все в одной строке */
`;

const ActionButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 3px 6px; /* Уменьшаем padding для кнопок */
  cursor: pointer;
  font-size: 0.7em; /* Уменьшаем размер шрифта для кнопок */

  &:hover {
    background-color: #0056b3;
  }

  &.delete {
    background-color: #dc3545;
    &:hover {
      background-color: #c82333;
    }
  }

  &.duplicate {
    background-color: #ffc107;
    color: #333;
    &:hover {
      background-color: #e0a800;
    }
  }
`;

const TaskItem: React.FC<TaskItemProps> = ({
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
  hoursWorked, // Добавлено
  onDelete,
  onDuplicate,
  onEdit,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id, type, title, time, address, childName, hourlyRate, comments, category, amountEarned, amountSpent, hoursWorked },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  drag(ref); // Применяем drag-источник к ref

  const handleEditClick = () => {
    // Передаем всеProps задачи для редактирования
    onEdit({
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
    });
  };

  return (
    <TaskItemContainer ref={ref} isDragging={isDragging} itemType={type} onClick={handleEditClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <TaskInfoContainer>
          <TaskTitle>{title}</TaskTitle>
          <TaskDetail>
            {type === 'income' ? `Заработано: ${amountEarned || 0}₽` : `Потрачено: ${amountSpent || 0}₽`}
          </TaskDetail>
        </TaskInfoContainer>
        <ButtonContainer>
          <ActionButton className="delete" onClick={(e) => { e.stopPropagation(); onDelete(id || ''); }}>
            🗑️
          </ActionButton>
          <ActionButton className="duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(id || ''); }}>
            📄
          </ActionButton>
        </ButtonContainer>
      </div>
    </TaskItemContainer>
  );
};

export default TaskItem;
