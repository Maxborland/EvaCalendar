import type { Moment } from 'moment';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDrop, type DropTargetMonitor } from 'react-dnd';
import { useNav } from '../context/NavContext';
import { deleteTask, duplicateTask, getTasksByWeekAndDay, moveTask } from '../services/api';
import './DayColumn.css';
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
  category?: string;
  amountEarned?: number;
  amountSpent?: number;
  hoursWorked?: number;
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

const DayColumn: React.FC<DayColumnProps> = (props) => {
  const { day, fullDate, today, weekId, onTaskMove } = props;
  const isToday = fullDate.isSame(today, 'day');
  const dayColumnClassName = `day-column ${isToday ? 'today-highlight' : ''}`;

const { setIsNavVisible, setIsModalOpen } = useNav();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  const dayOfWeekFormattedRu = fullDate.clone().locale('ru').format('dddd');
  const dayOfWeekForApi = dayOfWeekFormattedRu.charAt(0).toUpperCase() + dayOfWeekFormattedRu.slice(1); // Форматируем для API (e.g., "Понедельник")

  // weekId из props уже является UUID, который ожидает API
  const fetchTasks = useCallback(async () => {
    try {
      const response = await getTasksByWeekAndDay(weekId, dayOfWeekForApi); // Используем weekId из props
      setTasks(response.data as Task[]);
    } catch (error) {
      console.error('Ошибка при загрузке задач:', error);
    }
  }, [weekId, dayOfWeekForApi]); // Зависимость от weekId и dayOfWeekForApi

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]); // Удалена зависимость от onTaskMove

  const handleOpenForm = (task?: Task) => {
    if (task && task.id) { // Проверяем, что task и его id существуют
      setEditingTask(task);
    } else {
      // Инициализируем все поля, подходящие для создания новой задачи
      setEditingTask({
        id: undefined,
        type: 'income',
        title: '',
        time: '',
        address: '',
        childName: '',
        hourlyRate: 0,
        comments: '',
        category: '',
        amountEarned: 0,
        amountSpent: 0,
        hoursWorked: 0,
      });
    }
    setShowForm(true);
    setIsNavVisible(false); // Скрываем навигацию при открытии формы
    setIsModalOpen(true); // Устанавливаем isModalOpen в true при открытии формы
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(undefined);
    setIsNavVisible(true); // Показываем навигацию при закрытии формы
    setIsModalOpen(false); // Устанавливаем isModalOpen в false при закрытии формы
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
        handleMoveTask(item.id!, weekId, dayOfWeekForApi); // Используем форматированный день недели для API
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [weekId, dayOfWeekForApi]); // Зависимость от dayOfWeekForApi

  drop(dropRef);

  return (
    <div ref={dropRef} className={`${dayColumnClassName} ${isOver ? 'highlighted-drop-zone' : ''}`}>
      <h3>{day}</h3>
      <div className="day-cells"> {/* Удаляем onClick отсюда */}
        {/* Оставляем onClick только на пустых ячейках */}
        {tasks.length > 0 ? (
          tasks.map((task) => (
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
          ))
        ) : (
          <div className="no-tasks-message"></div>
        )}
        {/* Оставляем onClick только на пустых ячейках */}
        {tasks.length < 5 && Array.from({ length: Math.max(0, 5 - tasks.length) }).map((_, index) => (
          <div key={index} className="day-cell-empty" onClick={() => handleOpenForm()}></div>
        ))}
      </div>
      {showForm && (
        <TaskForm
          initialData={editingTask}
          weekId={weekId} // Используем weekId из props
          dayOfWeek={dayOfWeekForApi} // Передаем форматированный день недели для API
          onTaskSaved={() => {
            fetchTasks();
            setIsNavVisible(true); // Показываем навигацию при сохранении задачи
          }}
          onClose={handleCloseForm}
        />
      )}
      <button className="add-task-button" onClick={() => handleOpenForm()}>Добавить дело</button>
    </div>
  );
};

export default React.memo(DayColumn);