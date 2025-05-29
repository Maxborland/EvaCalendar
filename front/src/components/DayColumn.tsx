import type { Moment } from 'moment';
import React, { useEffect, useState } from 'react';
import { createTask, deleteTask, duplicateTask, getTasksByWeekAndDay, moveTask, updateTask } from '../services/api';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';

interface Task {
  id?: string; // id может быть необязательным для новых задач
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

  // Для получения недели из Moment, пока weekId не определен в бэкенде
  // Предположим, что weekId - это номер недели в году
  const currentWeekId = fullDate.week().toString();

  // Загрузка задач при монтировании компонента и при изменении дня/недели
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await getTasksByWeekAndDay(currentWeekId, day);
        setTasks(response.data as Task[]); // Явная привязка типа
      } catch (error) {
        console.error('Ошибка при загрузке задач:', error);
      }
    };
    fetchTasks();
  }, [currentWeekId, day]); // Зависимости

  const handleOpenForm = (task?: Task) => {
    if (task) {
      setEditingTask(task);
    } else {
      // Инициализация данных для новой задачи, включая weekId и dayOfWeek
      setEditingTask({
        id: undefined,
        type: 'income', // Дефолтный тип
        // Эти поля будут добавлены в качестве weekId и dayOfWeek при отправке на бэкенд
        // в handleSaveTask, поэтому они не являются частью интерфейса Task.
        // Здесь они инициализируются для передачи в TaskForm.
        // fullDate: fullDate.toISOString(),
        // dayOfWeek: day,

        title: '',
        time: '',
        address: '',
        childName: '',
        hourlyRate: 0,
        comments: '',
        what: '',
        amount: 0,
        expenseComments: '',
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(undefined);
  };

  const handleSaveTask = async (newTaskData: Task & { id?: string }) => {
    try {
      let savedTask: Task; // Явная привязка типа
      const dataToSend = { ...newTaskData, weekId: currentWeekId, dayOfWeek: day };

      if (newTaskData.id) {
        // Обновляем существующую задачу
        const response = await updateTask(newTaskData.id, dataToSend);
        savedTask = response.data as Task; // Явная привязка типа
        setTasks(tasks.map((task) => (task.id === savedTask.id ? savedTask : task)));
      } else {
        // Создаем новую задачу
        const response = await createTask(dataToSend);
        savedTask = response.data as Task; // Явная привязка типа
        setTasks([...tasks, savedTask]);
      }
      handleCloseForm();
    } catch (error) {
      console.error('Ошибка при сохранении задачи:', error);
      // Здесь можно добавить обработку ошибок, например, показать сообщение пользователю
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
      setTasks(tasks.filter((task) => task.id !== id));
    } catch (error) {
      console.error('Ошибка при удалении задачи:', error);
    }
  };

  const handleDuplicateTask = async (id: string) => {
    try {
      const response = await duplicateTask(id);
      setTasks([...tasks, response.data as Task]);
    } catch (error) {
      console.error('Ошибка при дублировании задачи:', error);
    }
  };

  const handleMoveTask = async (taskId: string, newWeekId: string, newDayOfWeek: string) => {
    try {
      await moveTask(taskId, newWeekId, newDayOfWeek);
      // После перемещения, задача будет загружена снова через useEffect или удалена локально
      setTasks(tasks.filter(task => task.id !== taskId)); // Удаляем из текущего дня
    } catch (error) {
      console.error('Ошибка при перемещении задачи:', error);
    }
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