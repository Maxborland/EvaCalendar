import React, { useState } from 'react';
import type { Task } from '../context/AppContext';
import { useAppContext } from '../context/AppContext';
import { formatDate } from '../utils/helpers';
import './DayColumn.css';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';

interface DayColumnProps {
  dayName: string;
  dayOfWeek: number; // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  date: Date; // The actual date for this column
  tasks: Task[];
}

const DayColumn: React.FC<DayColumnProps> = ({ dayName, dayOfWeek, date, tasks }) => {
  const { addTask, updateTask, deleteTask, duplicateTask, moveTask, currentWeekStart } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  const handleAddTask = (newTask: Task) => {
    // Determine the position for the new task
    const newPosition = tasks.length > 0 ? Math.max(...tasks.map(t => t.position)) + 1 : 0;
    return addTask({ ...newTask, position: newPosition, dayOfWeek, weekStart: formatDate(currentWeekStart), date: formatDate(date) });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    return updateTask(updatedTask.id!, updatedTask);
  };

  const handleDeleteTask = (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить это дело?')) {
      deleteTask(id);
    }
  };

  const handleDuplicateTask = (id: number) => {
    duplicateTask(id);
  };

  const handleMoveTask = async (id: number, newDayOfWeek: number, newPosition: number, newWeekStart: string, newDate: string) => {
    // This is a simplified move. For drag and drop, this would be more complex.
    // For now, we'll just use the provided newDayOfWeek, newPosition, newWeekStart, newDate
    await moveTask(id, newDayOfWeek, newPosition, newWeekStart, newDate);
  };

  const sortedTasks = [...tasks].sort((a, b) => a.position - b.position);

  return (
    <div className="day-column">
      <h3>{dayName} <br /> {formatDate(date)}</h3>
      <div className="tasks-list">
        {sortedTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onDuplicate={handleDuplicateTask}
            onMove={handleMoveTask}
            dayOfWeek={dayOfWeek}
            weekStart={formatDate(currentWeekStart)}
            position={task.position}
          />
        ))}
        {tasks.length < 5 && ( // Limit to 5 tasks per day as per requirements
          <button className="add-task-button" onClick={() => {
            setEditingTask(undefined);
            setShowForm(true);
          }}>+ Добавить дело</button>
        )}
      </div>

      {showForm && (
        <TaskForm
          initialTask={editingTask}
          onClose={() => setShowForm(false)}
          onSave={editingTask ? handleUpdateTask : handleAddTask}
          dayOfWeek={dayOfWeek}
          weekStart={formatDate(currentWeekStart)}
          date={formatDate(date)}
          position={tasks.length > 0 ? Math.max(...tasks.map(t => t.position)) + 1 : 0} // Default position for new task
        />
      )}
    </div>
  );
};

export default DayColumn;