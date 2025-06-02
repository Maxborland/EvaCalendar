import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DetailedTaskCard from '../components/DetailedTaskCard';
import TaskForm from '../components/TaskForm';
import { type Task, createTask, deleteTask, getTasksForDay, updateTask } from '../services/api';
import { formatDateForDisplay, parseDateString } from '../utils/dateUtils';
import './DayDetailsPage.css';

interface DayDetailsParams extends Record<string, string | undefined> {
  dateString: string;
}

const DayDetailsPage: React.FC = () => {
  const { dateString } = useParams<DayDetailsParams>();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sortedTasks, setSortedTasks] = useState<Task[]>([]); // Для отсортированных задач
  const [dailySummary, setDailySummary] = useState<{ totalEarned: number; totalSpent: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  // Функция для обновления данных дня (задачи и сводка)
  const fetchDayData = async (currentDateString: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedTasks = await getTasksForDay(currentDateString);
      setTasks(fetchedTasks);

      // Расчет сводки на основе полученных задач
      let totalEarned = 0;
      let totalSpent = 0;
      fetchedTasks.forEach(task => {
        if (task.type === 'expense' && task.amount) {
          totalSpent += task.amount;
        } else if (task.amount) { // 'income', 'fixed', 'hourly'
          totalEarned += task.amount;
        }
      });
      setDailySummary({ totalEarned, totalSpent });

    } catch (err) {
      console.error("Error fetching day data:", err);
      setError("Ошибка при загрузке данных дня.");
      setTasks([]); // Очищаем задачи в случае ошибки
      setDailySummary(null); // Очищаем сводку
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (dateString) {
      try {
        const parsedDate = parseDateString(dateString); // Ожидаем YYYY-MM-DD
        setSelectedDate(parsedDate);
      } catch (e) {
        console.error("Error parsing date string:", e);
        setError("Неверный формат даты в URL.");
        setIsLoading(false);
        return;
      }
    } else {
      setError("Дата не указана в URL.");
      setIsLoading(false);
    }
  }, [dateString]);

  useEffect(() => {
    if (selectedDate && dateString) {
      fetchDayData(dateString);
    }
  }, [selectedDate, dateString]);

  useEffect(() => {
    const timeSpecificTasks: Task[] = [];
    const otherTasks: Task[] = [];
    const expenseTasks: Task[] = [];

    tasks.forEach(task => {
      if (task.type === 'expense') {
        expenseTasks.push(task);
      } else if (task.time && /^\d{2}:\d{2}$/.test(task.time)) {
        timeSpecificTasks.push(task);
      } else {
        otherTasks.push(task);
      }
    });

    const sortTasksByTime = (a: Task, b: Task) => {
      if (a.time && b.time) {
        return a.time.localeCompare(b.time);
      }
      if (a.time) return -1; // a имеет время, b - нет, a идет раньше
      if (b.time) return 1;  // b имеет время, a - нет, b идет раньше
      return 0; // у обоих нет времени
    };

    timeSpecificTasks.sort(sortTasksByTime);
    otherTasks.sort(sortTasksByTime); // Сортируем "другие" задачи также по времени, если оно есть
    expenseTasks.sort(sortTasksByTime);

    setSortedTasks([...timeSpecificTasks, ...otherTasks, ...expenseTasks]);
  }, [tasks]);

  const handleGoBack = () => {
    navigate(-1); // Возвращает на предыдущую страницу в истории
  };

  const handleOpenTaskForm = (task?: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = () => {
    setEditingTask(undefined);
    setShowTaskForm(false);
  };

  const handleTaskSave = async (taskData: Omit<Task, 'id'> | Task) => {
    try {
      if ('id' in taskData && taskData.id) {
        // Обновление существующей задачи
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...updateData } = taskData; // Удаляем id из данных для обновления
        await updateTask(taskData.id, updateData as Partial<Omit<Task, 'id'>>);
      } else {
        // Создание новой задачи
        await createTask(taskData as Omit<Task, 'id'>);
      }
      handleCloseTaskForm();
      if (dateString) fetchDayData(dateString); // Обновить данные
    } catch (err) {
      console.error("Error saving task:", err);
      setError("Ошибка при сохранении задачи.");
      // Можно добавить более специфичную обработку ошибок, например, вывод сообщения пользователю
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
      try {
        await deleteTask(taskId);
        if (dateString) fetchDayData(dateString); // Обновить данные
      } catch (err) {
        console.error("Error deleting task:", err);
        setError("Ошибка при удалении задачи.");
      }
    }
  };

  // Функционал дублирования пока уберем, т.к. его не было в явных требованиях к API
  // const handleTaskDuplicate = async (taskId: string) => {
  //   try {
  //     await duplicateTask(taskId);
  //     if (dateString) fetchDayData(dateString); // Обновить данные
  //   } catch (err) {
  //     console.error("Error duplicating task:", err);
  //     setError("Ошибка при дублировании задачи.");
  //   }
  // };

  const handleToggleComplete = async (task: Task) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...updateData } = task;
      await updateTask(task.id, { ...updateData, completed: !task.completed });
      if (dateString) fetchDayData(dateString);
    } catch (err) {
      console.error("Error updating task completion:", err);
      setError("Ошибка при обновлении статуса задачи.");
    }
  };


  if (isLoading) {
    return <div className="day-details-loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="day-details-error">Ошибка: {error}</div>;
  }

  if (!selectedDate) {
    return <div className="day-details-error">Дата не найдена.</div>;
  }

  return (
    <div className="day-details-page">
      <div className="day-details-header">
        <button onClick={handleGoBack} className="back-button">
          &larr; Назад
        </button>
        <h1>{formatDateForDisplay(selectedDate)}</h1>
      </div>

      {dailySummary && (
        <div className="day-details-summary">
          Доход: {dailySummary.totalEarned} | Расход: {dailySummary.totalSpent}
        </div>
      )}

      <div className="day-details-tasks-section">
        <h2>Задачи</h2>
        <button className="add-task-button" onClick={() => handleOpenTaskForm()}>+ Добавить задачу</button>
        <div className="tasks-list">
          {tasks.length > 0 ? (
            sortedTasks.map(task => (
              <DetailedTaskCard
                key={task.id}
                task={task}
                onEdit={handleOpenTaskForm}
                onDelete={() => handleTaskDelete(task.id)}
                // onDuplicate={() => handleTaskDuplicate(task.id)} // Дублирование пока убрано
                // onToggleComplete={() => handleToggleComplete(task)} // Удалено согласно задаче
              />
            ))
          ) : (
            <p>На этот день задач нет.</p>
          )}
        </div>
      </div>

      {showTaskForm && selectedDate && dateString &&
        (() => {
          let formInitialData: Partial<Task> & { formType: "income" | "expense" }; // Используем formType для формы

          if (editingTask) {
            const { type, ...restOfTask } = editingTask;
            formInitialData = {
              ...restOfTask,
              formType: type === 'expense' ? 'expense' : 'income',
              // Убедимся, что amount передается правильно
              amount: editingTask.amount,
            };
          } else {
            formInitialData = {
              formType: 'income',
              title: '',
              dueDate: dateString, // Используем dateString напрямую
              // type: 'income', // Устанавливаем тип задачи по умолчанию для новых
            };
          }
          return (
            <TaskForm
              initialData={formInitialData}
              onTaskSaved={(taskDataFromForm) => {
                // Логика определения типа задачи и другие преобразования теперь внутри TaskForm.
                // DayDetailsPage просто вызывает handleTaskSave с данными, которые возвращает TaskForm.
                handleTaskSave(taskDataFromForm);
              }}
              onClose={handleCloseTaskForm}
              onDelete={editingTask?.id ? () => handleTaskDelete(editingTask!.id!) : undefined}
              // onDuplicate={editingTask?.id ? () => handleTaskDuplicate(editingTask!.id!) : undefined} // Дублирование пока убрано
            />
          );
        })()
      }
    </div>
  );
};

export default DayDetailsPage;