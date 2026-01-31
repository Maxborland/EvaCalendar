import clsx from 'clsx';
import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DetailedTaskCard from '../components/DetailedTaskCard';
import TopNavigator from '../components/TopNavigator';
import UnifiedTaskFormModal from '../components/UnifiedTaskFormModal';
import { useAuth } from '../context/AuthContext';
import { useCreateTask, useDeleteTask, useTasks, useUpdateTask } from '../hooks/useTasks';
import { type Task, getDailySummary } from '../services/api';
import { createDate, formatDateForDisplay, isSameDay, parseDateString } from '../utils/dateUtils';


const DayDetailsPage: FC = () => {
  const { dateString } = useParams<{ dateString: string }>();
  const { data: allTasks = [] } = useTasks();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
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
      } catch {
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
    }

    try {
      if ('uuid' in taskData && taskData.uuid) {
        const { uuid: taskUuid, ...updateData } = taskData;
        await updateTaskMutation.mutateAsync({ uuid: taskUuid, data: updateData as Partial<Omit<Task, 'uuid'>> });
      } else {
        await createTaskMutation.mutateAsync(taskData as Omit<Task, 'uuid'>);
      }
    } catch (err) {
      setError("Ошибка при сохранении задачи.");
      throw err;
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!isAuthenticated && !isAuthLoading) {
      navigate('/login');
      setError("Пользователь не аутентифицирован. Невозможно удалить задачу.");
      return;
    }
    if (isAuthLoading) return;

    try {
      await deleteTaskMutation.mutateAsync(taskId);
    } catch {
      setError("Ошибка при удалении задачи.");
    }
  };
  if (error) {
    return (
      <div className="text-center p-8 text-expense-primary text-lg">
        Ошибка: {error}
      </div>
    );
  }

  if (!selectedDate) {
    return (
      <div className="text-center p-8 text-expense-primary text-lg">
        Дата не найдена.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-surface-app overflow-hidden">
      <TopNavigator
        title={formatDateForDisplay(selectedDate)}
        showBackButton={true}
        showButtons={false}
      />

      <main className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto min-h-0 scrollbar-thin max-[480px]:p-3 max-[480px]:gap-3">
        {dailySummary && (
          <div className="flex gap-3 p-3 bg-surface-raised rounded-2xl border border-border-subtle shadow-glass max-[480px]:flex-col max-[480px]:gap-2">
            <div className="flex-1 flex flex-col gap-1 p-2 rounded-xl bg-surface-muted border-l-[3px] border-l-income-primary">
              <span className="text-sm font-medium text-text-secondary">Доход:</span>
              <span className="text-xl font-semibold text-income-primary leading-tight max-[480px]:text-lg">
                {dailySummary.totalEarned} ₽
              </span>
            </div>
            <div className="flex-1 flex flex-col gap-1 p-2 rounded-xl bg-surface-muted border-l-[3px] border-l-expense-primary">
              <span className="text-sm font-medium text-text-secondary">Расход:</span>
              <span className="text-xl font-semibold text-expense-primary leading-tight max-[480px]:text-lg">
                {dailySummary.totalSpent} ₽
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center gap-3 max-[480px]:flex-col max-[480px]:items-stretch">
          <h2 className="m-0 text-2xl font-semibold text-text-primary leading-tight max-[480px]:text-xl">
            Дела
          </h2>
          <button
            className={clsx(
              'inline-flex items-center gap-2 py-2 px-4 min-h-11 whitespace-nowrap',
              'rounded-xl border-none text-base font-semibold cursor-pointer',
              'bg-gradient-to-br from-btn-primary-bg to-[var(--theme-primary)] text-btn-primary-text shadow-glass',
              'transition-all duration-[180ms]',
              'hover:-translate-y-0.5 hover:shadow-elevation-2',
              'active:translate-y-0 active:shadow-glass',
              'max-[480px]:w-full max-[480px]:justify-center',
            )}
            onClick={() => handleOpenTaskForm()}
          >
            <span className="material-icons text-[20px]">add</span>
            Создать дело
          </button>
        </div>

        <div className="flex flex-col gap-3">
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
            <p className="text-center p-8 text-text-secondary text-base border border-dashed border-border-subtle rounded-2xl bg-surface-muted">
              На этот день задач нет.
            </p>
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
