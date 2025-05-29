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
  what?: string;
  amount?: number;
  expenseComments?: string;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onEdit: (task: any) => void;
}

const ItemTypes = {
  TASK: 'task',
};

const TaskItemContainer = styled.div.attrs<{ isDragging: boolean }>(props => ({
  style: {
    opacity: props.isDragging ? 0.5 : 1,
  },
}))`
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: grab;
`;

const TaskTitle = styled.h4`
  margin: 0 0 5px 0;
  color: #333;
`;

const TaskDetail = styled.p`
  margin: 0 0 3px 0;
  color: #555;
  font-size: 0.9em;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 5px;
  margin-top: 10px;
`;

const ActionButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 0.8em;

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
  what,
  amount,
  expenseComments,
  onDelete,
  onDuplicate,
  onEdit,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id, type, title, time, address, childName, hourlyRate, comments, what, amount, expenseComments },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  drag(ref); // Применяем drag-источник к ref

  const handleEditClick = () => {
    if (type === 'income') {
      onEdit({ id, type, title, time, address, childName, hourlyRate, comments });
    } else {
      onEdit({ id, type, what, amount, expenseComments });
    }
  };

  return (
    <TaskItemContainer ref={ref} isDragging={isDragging} onClick={handleEditClick}>
      {type === 'income' ? (
        <>
          <TaskTitle>{title}</TaskTitle>
          <TaskDetail>Время: {time}</TaskDetail>
          <TaskDetail>Адрес: {address}</TaskDetail>
          <TaskDetail>Имя ребенка: {childName}</TaskDetail>
          <TaskDetail>Ставка: ${hourlyRate}/час</TaskDetail>
          <TaskDetail>Комментарии: {comments}</TaskDetail>
        </>
      ) : (
        <>
          <TaskTitle>{what}</TaskTitle>
          <TaskDetail>Сумма: ${amount}</TaskDetail>
          <TaskDetail>Комментарий: {expenseComments}</TaskDetail>
        </>
      )}
      <ButtonContainer>
        <ActionButton className="delete" onClick={(e) => { e.stopPropagation(); onDelete(id || ''); }}>
          Удалить
        </ActionButton>
        <ActionButton className="duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(id || ''); }}>
          Дублировать
        </ActionButton>
      </ButtonContainer>
    </TaskItemContainer>
  );
};

export default TaskItem;