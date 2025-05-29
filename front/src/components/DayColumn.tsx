import type { Moment } from 'moment';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDrop, type DropTargetMonitor } from 'react-dnd';
import { deleteTask, duplicateTask, getTasksByWeekAndDay, moveTask } from '../services/api';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';

interface Task {
  id?: string;
  type: 'income' | 'expense';
  title?: string;
  time?: string;
  address?: string;
  childName?: string;
  hourlyRate?: number;
  comments?: string;
  category?: string; // Добавляем поле category для трат
  amountEarned?: number; // Добавляем поле amountEarned
  amountSpent?: number; // Добавляем поле amountSpent
  weekId?: string;
  dayOfWeek?: string;
}

const ItemTypes = {
  TASK: 'task',
};

interface DayColumnProps {
  day: string; // Это общее название дня (например, "Пн", "Вт")
  fullDate: Moment;
  today: Moment;
  weekId: string;
  onTaskMove: () => void;
}

const DayColumn: React.FC<DayColumnProps> = ({ day, fullDate, today, weekId, onTaskMove }) => {
  const isToday = fullDate.isSame(today, 'day');
  const dayColumnClassName = `day-column ${isToday ? 'today-highlight' : ''}`;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  const currentWeekId = fullDate.week().toString();
  const dayOfWeekFormatted = fullDate.format('dddd'); // Форматируем fullDate в название дня недели (e.g., "Monday")

  const fetchTasks = useCallback(async () => {
    try {
      const response = await getTasksByWeekAndDay(currentWeekId, dayOfWeekFormatted); // Используем форматированный день недели
      setTasks(response.data as Task[]);
    } catch (error) {
      console.error('Ошибка при загрузке задач:', error);
    }
  }, [currentWeekId, dayOfWeekFormatted]); // Зависимость от dayOfWeekFormatted

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, onTaskMove]);

  const handleOpenForm = (task?: Task) => {
    if (task) {
      setEditingTask(task);
    } else {
      setEditingTask({
        id: undefined,
        type: 'income',
        title: '',
        time: '',
        address: '',
        childName: '',
        hourlyRate: 0,
        comments: '',
        category: '', // Инициализируем category
        amountEarned: 0, // Инициализируем amountEarned
        amountSpent: 0, // Инициализируем amountSpent
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(undefined);
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
      fetchTasks();
    } catch (error) {
      console.error('Ошибка при удалении задачи:', error);
    }
  };

  const handleDuplicateTask = async (id: string) => {
    try {
      await duplicateTask(id);
      fetchTasks();
    } catch (error) {
      console.error('Ошибка при дублировании задачи:', error);
    }
  };

  const handleMoveTask = async (taskId: string, targetWeekId: string, targetDayOfWeek: string) => {
    try {
      await moveTask(taskId, targetWeekId, targetDayOfWeek);
      onTaskMove();
    } catch (error) {
      console.error('Ошибка при перемещении задачи:', error);
    }
  };

  const dropRef = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    drop: (item: Task, monitor: DropTargetMonitor) => {
      if (!monitor.didDrop()) {
        handleMoveTask(item.id!, weekId, dayOfWeekFormatted); // Используем форматированный день недели
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [weekId, dayOfWeekFormatted]); // Зависимость от dayOfWeekFormatted

  drop(dropRef);

  return (
    <div ref={dropRef} className={`${dayColumnClassName} ${isOver ? 'highlighted-drop-zone' : ''}`}>
      <h3>{day}</h3>
      <div className="day-cells" onClick={() => handleOpenForm()}>
        {tasks.map((task) => (
          task.id ? (
            <TaskItem
              key={task.id}
              id={task.id}
              {...task}
              onDelete={handleDeleteTask}
              onDuplicate={handleDuplicateTask}
              onEdit={handleOpenForm}
            />
          ) : null
        ))}
        {Array.from({ length: Math.max(0, 5 - tasks.length) }).map((_, index) => (
          <div key={index} className="day-cell-empty" onClick={() => handleOpenForm()}></div>
        ))}
      </div>
      {showForm && (
        <TaskForm
          initialData={editingTask}
          weekId={currentWeekId}
          dayOfWeek={dayOfWeekFormatted} // Передаем форматированный день недели
          onTaskSaved={fetchTasks}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default DayColumn;