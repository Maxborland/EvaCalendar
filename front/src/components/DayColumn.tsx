import type { Moment } from 'moment';
import React, { useEffect, useRef, useState } from 'react'; // useCallback удален, так как fetchTasks удаляется
import { useDrop, type DropTargetMonitor } from 'react-dnd';
import { useNav } from '../context/NavContext';
import { deleteTask, duplicateTask, moveTask, type Task } from '../services/api'; // getTasksByWeekAndDay удален, Task и Note импортированы
import './DayColumn.css';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';

// Локальное определение Task удалено

const ItemTypes = {
  TASK: 'task',
};

interface DayColumnProps {
  day: string; // Это общее название дня (например, "Пн", "Вт")
  fullDate: Moment;
  today: Moment;
  tasksForDay: Task[]; // Новый проп
  onTaskMove: () => void;
}

const DayColumn: React.FC<DayColumnProps> = (props) => {
  const { day, fullDate, today, tasksForDay, onTaskMove } = props; // weekId удален, tasksForDay добавлен

  const isToday = fullDate.isSame(today, 'day');
  const dayColumnClassName = `day-column ${isToday ? 'today-highlight' : ''}`;

  const { setIsNavVisible, setIsModalOpen } = useNav();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  // editingTask теперь может быть Partial<Task> для новых задач, или Task для существующих.
  // TaskForm ожидает initialData?: Partial<Task> & { type: 'income' | 'expense' };
  const [editingTask, setEditingTask] = useState<(Partial<Task> & { type: 'income' | 'expense' }) | undefined>(undefined);

  const dayOfWeekFormattedRu = fullDate.clone().locale('ru').format('dddd');
  // dayOfWeekForApi удален

  // Логика fetchTasks удалена, задачи теперь приходят через props.tasksForDay
  useEffect(() => {

    setTasks(tasksForDay);
  }, [tasksForDay, fullDate]);

  const handleOpenForm = (task?: Task) => { // task здесь это Task из api.ts
    if (task && task.uuid) { // Редактирование существующей задачи
      // Убедимся, что тип задачи совместим с ожиданиями TaskForm
      if (task.type === 'income' || task.type === 'expense') {
        setEditingTask(task as Task & { type: 'income' | 'expense' });
      } else {
        // Если тип несовместим, можно установить тип по умолчанию или показать ошибку
        // Пока установим 'income' и залогируем предупреждение
        console.warn(`Task with id ${task.uuid} has an incompatible type: ${task.type}. Defaulting to 'income'.`);
        setEditingTask({ ...task, type: 'income' });
      }
    } else {
      // Создание новой задачи
      setEditingTask({
        // id не указываем, TaskForm сгенерирует его
        type: 'income', // Тип по умолчанию для новой задачи
        title: '',
        dueDate: props.fullDate.format('YYYY-MM-DD'), // Устанавливаем dueDate из даты колонки
        // Остальные поля будут инициализированы в TaskForm
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
      onTaskMove(); // Вызываем onTaskMove для обновления задач в родительском компоненте
    } catch (error) {
      console.error('Ошибка при удалении задачи:', error);
    }
  };

  const handleDuplicateTask = async (id: string) => {
    try {
      await duplicateTask(id);
      onTaskMove(); // Вызываем onTaskMove для обновления задач в родительском компоненте
    } catch (error) {
      console.error('Ошибка при дублировании задачи:', error);
    }
  };

  const handleMoveTask = async (taskId: string, newDueDate: string) => { // Сигнатура изменена
    try {
      await moveTask(taskId, newDueDate); // Вызов moveTask изменен
      onTaskMove();
    } catch (error) {
      console.error('Ошибка при перемещении задачи:', error);
    }
  };

  const dropRef = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    drop: (item: Task, monitor: DropTargetMonitor) => {
      if (!monitor.didDrop() && item.uuid) { // Добавлена проверка item.uuid
        handleMoveTask(item.uuid, props.fullDate.format('YYYY-MM-DD')); // Передаем ID задачи и newDueDate
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [props.fullDate, handleMoveTask]); // Зависимости обновлены

  drop(dropRef);

  return (
    <div ref={dropRef} className={`${dayColumnClassName} ${isOver ? 'highlighted-drop-zone' : ''}`}>
      <h3>{day}</h3>

      <div className="day-cells"> {/* Удаляем onClick отсюда */}
        {/* Оставляем onClick только на пустых ячейках */}
        {tasks.length > 0 ? (
          tasks.map((task) => (
            task.uuid ? (
              <TaskItem
                key={task.uuid}
                task={task}
                onDelete={handleDeleteTask}
                onDuplicate={handleDuplicateTask}
                onEdit={handleOpenForm}
              />
            ) : null
          ))
        ) : null}
      </div>
      {showForm && (
        <TaskForm
          initialData={editingTask} // editingTask теперь (Partial<Task> & { type: 'income' | 'expense' }) | undefined
          // initialDueDate удален, TaskForm использует initialData.dueDate или props.fullDate для установки даты по умолчанию
          // Передаем dueDate через initialData при создании новой задачи
          onTaskSaved={() => {
            onTaskMove();
            setIsNavVisible(true);
          }}
          onClose={handleCloseForm}
        />
      )}
      <button className="add-task-button" onClick={() => handleOpenForm(undefined)}>Добавить дело</button>
    </div>
  );
};

export default React.memo(DayColumn);