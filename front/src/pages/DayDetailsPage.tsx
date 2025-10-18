import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DetailedTaskCard from '../components/DetailedTaskCard';
import TopNavigator from '../components/TopNavigator';
import UnifiedTaskFormModal from '../components/UnifiedTaskFormModal';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { type Task, createTask, deleteTask, getDailySummary, updateTask } from '../services/api';
import { createDate, formatDateForDisplay, isSameDay, parseDateString } from '../utils/dateUtils';
import './DayDetailsPage.css';


const DayDetailsPage: FC = () => {
  const { dateString } = useParams<{ dateString: string }>();
  const { tasks: allTasks, refetchTasks } = useTasks();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth(); // Получаем состояние аутентификации
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dailySummary, setDailySummary] = useState<{ totalEarned: number; totalSpent: number } | null>(null);
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

  const tasks = useMemo(() => {
    if (!dateString) return [];
    return allTasks.filter(task => isSameDay(createDate(task.dueDate), createDate(dateString)));
  }, [allTasks, dateString]);

  useEffect(() => {
    if (dateString) {
      const fetchSummary = async () => {
        try {
          const summary = await getDailySummary(dateString);
          setDailySummary(summary);
        } catch (error) {
          console.error("Failed to fetch daily summary", error);
          setDailySummary(null);
        }
      };
      fetchSummary();
    }
  }, [dateString]);

  const sortedTasks = useMemo(() => {
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

    return [...timeSpecificTasks, ...otherTasks, ...expenseTasks];
  }, [tasks]);

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

  const handleTaskSave = async (taskData: Task | Omit<Task, 'uuid'>): Promise<void> => {
    if (!isAuthenticated && !isAuthLoading) {
      navigate('/login');
      setError("Пользователь не аутентифицирован. Невозможно сохранить задачу.");
      throw new Error("Пользователь не аутентифицирован.");
    }
    if (isAuthLoading) {
      throw new Error("Аутентификация в процессе.");
    };

    try {
      if ('uuid' in taskData && taskData.uuid) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { uuid, ...updateData } = taskData;
        await updateTask(taskData.uuid, updateData as Partial<Omit<Task, 'uuid'>>);
      } else {
        await createTask(taskData as Omit<Task, 'uuid'>);
      }
    } catch (err) {
      // Error saving task
      setError("Ошибка при сохранении задачи.");
      throw err; // Пробрасываем ошибку дальше, чтобы ее обработал handleSubmit в модалке
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
        refetchTasks();
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
      <TopNavigator
        title={formatDateForDisplay(selectedDate)}
        showBackButton={true}
        showButtons={false}
      />

      <main className="day-details-content">
        {dailySummary && (
          <div className="day-details-summary">
            <div className="day-details-summary__item day-details-summary__item--income">
              <span className="day-details-summary__label">Доход:</span>
              <span className="day-details-summary__value">{dailySummary.totalEarned} ₽</span>
            </div>
            <div className="day-details-summary__item day-details-summary__item--expense">
              <span className="day-details-summary__label">Расход:</span>
              <span className="day-details-summary__value">{dailySummary.totalSpent} ₽</span>
            </div>
          </div>
        )}

        <div className="day-details-header">
          <h2 className="day-details-title">Дела</h2>
          <button className="btn btn-primary day-details-add-btn" onClick={() => handleOpenTaskForm()}>
            <span className="material-icons">add</span>
            Создать дело
          </button>
        </div>

        <div className="day-details-tasks">
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
            <p className="day-details-empty">На этот день задач нет.</p>
          )}
        </div>
      </main>

      {showTaskForm && selectedDate && dateString && (
          <UnifiedTaskFormModal
            isOpen={showTaskForm}
            onClose={handleCloseTaskForm}
            onSubmit={handleTaskSave}
            onTaskUpsert={() => {
              handleCloseTaskForm();
              refetchTasks();
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