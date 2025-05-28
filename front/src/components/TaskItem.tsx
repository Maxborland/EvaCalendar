import React from 'react';
import type { Task } from '../context/AppContext';
import './TaskItem.css';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onMove: (id: number, newDayOfWeek: number, newPosition: number, newWeekStart: string, newDate: string) => void;
  dayOfWeek: number; // The day of the week this task item is rendered in
  weekStart: string; // The week start date this task item is rendered in
  position: number; // The current position of the task in the day
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onEdit, onDelete, onDuplicate, onMove, dayOfWeek, weekStart, position }) => {
  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    // This is a simplified example. Actual move logic would be more complex
    // and involve updating positions of other tasks.
    // For now, we'll just simulate a move within the same day/week.
    let newDay = dayOfWeek;
    let newPos = position;
    let newWeek = weekStart;
    let newDate = task.date; // Keep the same date for now, or calculate new date if moving to different week/day

    if (direction === 'up') {
      newPos = Math.max(0, position - 1);
    } else if (direction === 'down') {
      newPos = position + 1;
    }
    // For 'left' and 'right', we'd need to know the total number of days/weeks
    // and adjust dayOfWeek/weekStart accordingly. This will be handled by the parent component (DayColumn/WeekView)
    // when implementing drag and drop or more sophisticated move controls.

    onMove(task.id!, newDay, newPos, newWeek, newDate);
  };

  return (
    <div className={`task-item ${task.type}`}>
      <div className="task-details">
        <span className="task-title">{task.title}</span>
        {task.type === 'order' && (
          <>
            <span>Время: {task.time}</span>
            <span>Адрес: {task.address}</span>
            <span>Ребенок: {task.childName}</span>
            <span>Ставка: {task.hourlyRate} ₽/час</span>
          </>
        )}
        {task.type === 'expense' && (
          <>
            <span>Сумма: {task.amount} ₽</span>
            <span>Категория: {task.category}</span>
          </>
        )}
        {task.comment && <span className="task-comment">Комментарий: {task.comment}</span>}
      </div>
      <div className="task-actions">
        <button onClick={() => onEdit(task)}>Редактировать</button>
        <button onClick={() => onDelete(task.id!)}>Удалить</button>
        <button onClick={() => onDuplicate(task.id!)}>Дублировать</button>
        {/* Simplified move buttons for now */}
        <button onClick={() => handleMove('up')}>▲</button>
        <button onClick={() => handleMove('down')}>▼</button>
      </div>
    </div>
  );
};

export default TaskItem;