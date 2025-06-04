import React, { useEffect, useState } from 'react'; // useMemo уже был, но убедимся, что все импорты React на месте
import { useLoaderData, useNavigate } from 'react-router-dom'; // useLoaderData должен быть здесь
import DetailedTaskCard from '../components/DetailedTaskCard';
// Предполагаем, что TaskForm.tsx будет переименован в UnifiedTaskFormModal.tsx
import UnifiedTaskFormModal from '../components/UnifiedTaskFormModal';
// getTasksForDay и getDailySummary удаляются из импортов, так как данные приходят через loader
import { type Task, createTask, deleteTask, updateTask } from '../services/api';
import { formatDateForDisplay, parseDateString } from '../utils/dateUtils';
import './DayDetailsPage.css';

// interface DayDetailsParams extends Record<string, string | undefined> {
//   dateString: string;
// }

interface DayDetailsLoaderData {
  tasks: Task[];
  summary: { totalEarned: number; totalSpent: number } | null;
  dateString: string;
}

const DayDetailsPage: React.FC = () => {
  const { tasks: initialTasks, summary: initialSummary, dateString } = useLoaderData() as DayDetailsLoaderData;
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<Task[]>(initialTasks); // Инициализируем tasks из initialTasks
  const [sortedTasks, setSortedTasks] = useState<Task[]>([]);
  const [dailySummary, setDailySummary] = useState<{ totalEarned: number; totalSpent: number } | null>(initialSummary); // Инициализируем dailySummary из initialSummary
  // const [isLoading, setIsLoading] = useState(true); // Удалено, состояние загрузки управляется react-router
  const [error, setError] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentTaskType, setCurrentTaskType] = useState<'income' | 'expense' | undefined>('income');

  // const fetchDayData = async (currentDateString: string) => { ... }; // Удаляем, данные из loader

  useEffect(() => {
    if (dateString) { // Используем dateString из useLoaderData
      try {
        const parsedDate = parseDateString(dateString);
        setSelectedDate(parsedDate);
        setError(null); // Сбрасываем ошибку, если дата успешно распарсилась
      } catch (e) {
        console.error("Error parsing date string:", e);
        setError("Неверный формат даты в URL.");
        // setIsLoading(false); // Удалено
        return;
      }
    } else {
      // Эта ситуация не должна возникать, если loader требует dateString
      setError("Дата не указана.");
      // setIsLoading(false); // Удалено
    }
  }, [dateString]);

  // Обновляем tasks и dailySummary, если initialTasks или initialSummary из loader'а изменились
  // Это полезно для HMR или если loader перезапускается (например, через revalidate)
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    setDailySummary(initialSummary);
  }, [initialSummary]);


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
      // if (dateString) fetchDayData(dateString); // Обновить данные
      // TODO: Использовать revalidator.revalidate() или navigate('.', { replace: true }) для перезагрузки данных из loader'а
      // Временное решение: предполагаем, что initialTasks и initialSummary обновятся при следующей навигации или HMR.
      // Для немедленного обновления можно было бы снова установить tasks и summary из initialTasks,
      // но это не вызовет перезагрузку loader'а.
      // Для простоты пока оставим так, PageLoader должен сработать при следующей навигации, если loader будет вызван.
      // Чтобы увидеть эффект PageLoader при мутации, нужно обеспечить перезапуск loader'а.
      // Например, можно использовать navigate(location.pathname, { replace: true });
      // Это вызовет перезапуск loader'а для текущего пути.
      navigate('.', { replace: true }); // Перезагружаем данные через loader
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
        // if (dateString) fetchDayData(dateString); // Обновить данные
        // TODO: Использовать revalidator.revalidate() или navigate('.', { replace: true })
        navigate('.', { replace: true }); // Перезагружаем данные через loader
      } catch (err) {
        console.error("Error deleting task:", err);
        setError("Ошибка при удалении задачи.");
      }
    }
  };
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