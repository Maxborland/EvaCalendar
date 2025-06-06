import React, { useEffect, useState } from 'react'; // useMemo уже был, но убедимся, что все импорты React на месте
import { useLoaderData, useNavigate } from 'react-router-dom'; // useLoaderData должен быть здесь
import DetailedTaskCard from '../components/DetailedTaskCard';
import { useAuth } from '../context/AuthContext'; // Добавляем useAuth
// Предполагаем, что TaskForm.tsx будет переименован в UnifiedTaskFormModal.tsx
import UnifiedTaskFormModal from '../components/UnifiedTaskFormModal';
// getTasksForDay и getDailySummary удаляются из импортов, так как данные приходят через loader
import { type Task, createTask, deleteTask, updateTask } from '../services/api';
import { formatDateForDisplay, parseDateString } from '../utils/dateUtils';
import './DayDetailsPage.css';


interface DayDetailsLoaderData {
  tasks: Task[];
  summary: { totalEarned: number; totalSpent: number } | null;
  dateString: string;
}

const DayDetailsPage: React.FC = () => {
  const { tasks: initialTasks, summary: initialSummary, dateString } = useLoaderData() as DayDetailsLoaderData;
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth(); // Получаем состояние аутентификации
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [sortedTasks, setSortedTasks] = useState<Task[]>([]);
  const [dailySummary, setDailySummary] = useState<{ totalEarned: number; totalSpent: number } | null>(initialSummary);
  const [error, setError] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentTaskType, setCurrentTaskType] = useState<'income' | 'expense' | undefined>('income');

  useEffect(() => {
    if (!isAuthenticated && !isAuthLoading) {
      navigate('/login');
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  useEffect(() => {
    if (dateString) {
      try {
        const parsedDate = parseDateString(dateString);
        setSelectedDate(parsedDate);
        setError(null);
      } catch (e) {
        // Error parsing date string
        setError("Неверный формат даты в URL.");
        return;
      }
    } else {
      setError("Дата не указана.");
    }
  }, [dateString]);

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
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    };

    timeSpecificTasks.sort(sortTasksByTime);
    otherTasks.sort(sortTasksByTime);
    expenseTasks.sort(sortTasksByTime);

    setSortedTasks([...timeSpecificTasks, ...otherTasks, ...expenseTasks]);
  }, [tasks]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleOpenTaskForm = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setModalMode('edit');
      setCurrentTaskType(task.type === 'expense' ? 'expense' : 'income');
    } else {
      const newInitialTask = {
        dueDate: dateString,
      };
      setEditingTask(newInitialTask as Task);
      setModalMode('create');
      setCurrentTaskType(undefined);
    }
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = () => {
    setEditingTask(undefined);
    setShowTaskForm(false);
  };

  const handleTaskSave = async (taskData: Task | Omit<Task, 'uuid'>) => {
    if (!isAuthenticated && !isAuthLoading) {
      navigate('/login');
      setError("Пользователь не аутентифицирован. Невозможно сохранить задачу.");
      return;
    }
    if (isAuthLoading) return;

    try {
      if ('uuid' in taskData && taskData.uuid) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { uuid, ...updateData } = taskData;
        await updateTask(taskData.uuid, updateData as Partial<Omit<Task, 'uuid'>>);
      } else {
        await createTask(taskData as Omit<Task, 'uuid'>);
      }
      handleCloseTaskForm();
      // TODO: #TICKET-123 Использовать revalidator.revalidate() или navigate('.', { replace: true }) для перезагрузки данных из loader'а
      navigate('.', { replace: true }); // Это перезагрузит данные через loader, который должен быть защищен
    } catch (err) {
      // Error saving task
      setError("Ошибка при сохранении задачи.");
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!isAuthenticated && !isAuthLoading) {
      navigate('/login');
      setError("Пользователь не аутентифицирован. Невозможно удалить задачу.");
      return;
    }
    if (isAuthLoading) return;

    if (window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
      try {
        await deleteTask(taskId);
        // TODO: #TICKET-124 Использовать revalidator.revalidate() или navigate('.', { replace: true })
        navigate('.', { replace: true }); // Это перезагрузит данные через loader
      } catch (err) {
        // Error deleting task
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
          />
        )
      }
    </div>
  );
};

export default DayDetailsPage;