import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DetailedTaskCard from '../components/DetailedTaskCard';
// Предполагаем, что TaskForm.tsx будет переименован в UnifiedTaskFormModal.tsx
import UnifiedTaskFormModal from '../components/UnifiedTaskFormModal';
import { type Task, createTask, deleteTask, getDailySummary, getTasksForDay, updateTask } from '../services/api';
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
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentTaskType, setCurrentTaskType] = useState<'income' | 'expense' | undefined>('income');

  // Функция для обновления данных дня (задачи и сводка)
  const fetchDayData = async (currentDateString: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[DayDetailsPage] fetchDayData - currentDateString:', currentDateString); // LOG
      const fetchedTasks = await getTasksForDay(currentDateString);
      setTasks(fetchedTasks);

      // Получение сводки с бэкенда
      const summaryData = await getDailySummary(currentDateString);
      console.log('[DayDetailsPage] fetchDayData - summaryData from API:', summaryData); // LOG
      setDailySummary(summaryData);

    } catch (err) {
      console.error("Error fetching day data:", err);
      console.log('[DayDetailsPage] fetchDayData - full error object:', err); // LOG
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
    if (task) {
      console.log('[DayDetailsPage] handleOpenTaskForm - task to edit:', JSON.parse(JSON.stringify(task)));
      setEditingTask(task);
      setModalMode('edit');
      // Определяем taskType на основе существующей задачи, если редактируем
      setCurrentTaskType(task.type === 'expense' ? 'expense' : 'income');
    } else {
      // При создании новой задачи, устанавливаем dueDate из dateString текущей страницы
      const newInitialTask = {
        dueDate: dateString, // dateString уже в формате YYYY-MM-DD
        // Можно добавить другие поля по умолчанию, если необходимо
        // title: '',
      };
      setEditingTask(newInitialTask as Task); // Приводим к Task
      setModalMode('create');
      // Тип задачи будет выбран в модальном окне
      setCurrentTaskType(undefined); // или 'income' по умолчанию, если это предпочтительнее
    }
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = () => {
    setEditingTask(undefined);
    setShowTaskForm(false);
    // Сбрасываем режим и тип при закрытии, если это необходимо
    // setModalMode('create');
    // setCurrentTaskType('income');
  };

  const handleTaskSave = async (taskData: Task | Omit<Task, 'uuid'>) => {
    try {
      // Проверяем наличие uuid и что он не undefined для существующей задачи
      if ('uuid' in taskData && taskData.uuid) { // Удаляем проверку mode === 'edit'
        // Обновление существующей задачи
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { uuid, ...updateData } = taskData; // Удаляем uuid из данных для обновления
        await updateTask(taskData.uuid, updateData as Partial<Omit<Task, 'uuid'>>);
      } else {
        // Создание новой задачи
        await createTask(taskData as Omit<Task, 'uuid'>);
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

  // const handleToggleComplete = async (task: Task) => { // Удалено, так как не используется
  //   try {
  //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //     const { uuid, ...updateData } = task;
  //     await updateTask(task.uuid, { ...updateData, completed: !task.completed });
  //     if (dateString) fetchDayData(dateString);
  //   } catch (err) {
  //     console.error("Error updating task completion:", err);
  //     setError("Ошибка при обновлении статуса задачи.");
  //   }
  // };


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
        <button onClick={handleGoBack} className="btn btn-secondary">
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
        <h2>Дела</h2>
        <button className="btn btn-primary" onClick={() => handleOpenTaskForm()}>Создать дело</button>
        <div className="tasks-list">
          {tasks.length > 0 ? (
            sortedTasks.map((task, index) => (
              <DetailedTaskCard
                key={`task-${task.uuid || 'no-id'}-${index}`}
                task={task}
                onEdit={handleOpenTaskForm}
                onDelete={() => handleTaskDelete(task.uuid)}
                // onDuplicate={() => handleTaskDuplicate(task.uuid)} // Дублирование пока убрано
                // onToggleComplete={() => handleToggleComplete(task)} // Удалено согласно задаче
              />
            ))
          ) : (
            <p>На этот день задач нет.</p>
          )}
        </div>
      </div>

      {showTaskForm && selectedDate && dateString && (
          <UnifiedTaskFormModal
            isOpen={showTaskForm}
            onClose={handleCloseTaskForm}
            onSubmit={(taskDataFromForm: Task | Omit<Task, 'uuid'>) => {
              handleTaskSave(taskDataFromForm);
            }}
            mode={modalMode}
            initialTaskData={editingTask}
            initialTaskType={currentTaskType} // Исправлено taskType на initialTaskType
            onDelete={editingTask?.uuid ? () => handleTaskDelete(editingTask!.uuid!) : undefined}
            // onDuplicate={editingTask?.uuid ? () => handleTaskDuplicate(editingTask!.uuid!) : undefined}
          />
        )
      }
    </div>
  );
};

export default DayDetailsPage;