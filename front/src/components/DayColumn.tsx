import type { Moment } from 'moment';
import React, { useState } from 'react';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';

interface Task {
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
}

interface DayColumnProps {
  day: string;
  fullDate: Moment;
  today: Moment;
}

const DayColumn: React.FC<DayColumnProps> = ({ day, fullDate, today }) => {
  const isToday = fullDate.isSame(today, 'day');
  const dayColumnClassName = `day-column ${isToday ? 'today-highlight' : ''}`;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  const handleOpenForm = (task?: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(undefined);
  };

  const handleSaveTask = (newTaskData: Task & { id?: string }) => {
    if (newTaskData.id) {
      setTasks(tasks.map(task => task.id === newTaskData.id ? newTaskData : task));
    } else {
      setTasks([...tasks, { ...newTaskData, id: String(Date.now()) }]); // Assign a temporary ID
    }
    handleCloseForm();
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handleDuplicateTask = (id: string) => {
    const taskToDuplicate = tasks.find(task => task.id === id);
    if (taskToDuplicate) {
      setTasks([...tasks, { ...taskToDuplicate, id: String(Date.now()) }]);
    }
  };

  const handleMoveTask = (id: string) => {
    console.log('Move task:', id);
    // This will be implemented with drag and drop later
  };


  return (
    <div className={dayColumnClassName}>
      <h3>{day}</h3>
      <div className="day-cells">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            {...task}
            onDelete={handleDeleteTask}
            onDuplicate={handleDuplicateTask}
            onMove={handleMoveTask}
            onEdit={handleOpenForm} // Add onEdit prop
          />
        ))}
        {Array.from({ length: Math.max(0, 5 - tasks.length) }).map((_, index) => (
          <div key={index} className="day-cell-empty" onClick={() => handleOpenForm()}></div>
        ))}
      </div>
      {showForm && (
        <TaskForm
          initialData={editingTask}
          onSave={handleSaveTask}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default DayColumn;