import React from 'react';
import styled from 'styled-components';

interface TaskItemProps {
  id?: string;
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
  onMove: (taskId: string, newWeekId: string, newDayOfWeek: string) => Promise<void>;
  onEdit: (task: any) => void;
}

const TaskItemContainer = styled.div`
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
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

  &.move {
    background-color: #28a745;
    &:hover {
      background-color: #218838;
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
  onMove,
  onEdit,
}) => {
  const handleEditClick = () => {
    if (type === 'income') {
      onEdit({ id, type, title, time, address, childName, hourlyRate, comments });
    } else {
      onEdit({ id, type, what, amount, expenseComments });
    }
  };

  // Временно для отображения, пока не будут переданы правильные данные для onMove
  const handleMoveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Здесь мы должны были бы передать `weekId` и `dayOfWeek`,
    // но в текущем контексте TaskItem их нет.
    // Это будет реализовано через drag-and-drop в будущем,
    // тогда эти данные будут доступны из контекста перетаскивания.
    await onMove(id || '', '', '');
  }

  return (
    <TaskItemContainer onClick={handleEditClick}>
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
        <ActionButton className="move" onClick={async (e) => {
          e.stopPropagation();
          // Поскольку на фронтенде DayColumn.tsx handleMoveTask не принимает newWeekId and newDayOfWeek,
          // они не должны быть переданы здесь в TaskItem.
          // Но так как TaskItemProps.onMove теперь ожидает 3 аргументов, я временно передам пустые строки.
          // В реальном приложении, этот функционал будет реализован с помощью drag and drop,
          // и тогда эти данные будут доступны.
          await onMove(id || '', '', '');
        }}>
          Переместить
        </ActionButton>
      </ButtonContainer>
    </TaskItemContainer>
  );
};

export default TaskItem;