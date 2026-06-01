import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedTaskFormModal from '../components/UnifiedTaskFormModal';
import { useAuth } from '../context/useAuth';
import { useNav } from '../context/useNav';
import { useCreateTask } from './useTasks';
import type { Task } from '../services/api';
import { formatDateToYYYYMMDD } from '../utils/dateUtils';

type CreateTaskType = 'income' | 'expense' | 'task' | 'lesson';

const getTodayDateString = () => {
  const now = new Date();
  return formatDateToYYYYMMDD(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
};

export const useCreateTaskModal = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { setIsModalOpen, setIsNavVisible } = useNav();
  const createTaskMutation = useCreateTask();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [initialTaskType, setInitialTaskType] = useState<CreateTaskType>('income');
  const [initialTaskData, setInitialTaskData] = useState<Partial<Task>>({ dueDate: getTodayDateString() });

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setIsModalOpen(false);
    setIsNavVisible(true);
  }, [setIsModalOpen, setIsNavVisible]);

  const openCreateModal = useCallback((taskType: CreateTaskType = 'income', defaults: Partial<Task> = {}) => {
    setInitialTaskType(taskType);
    setInitialTaskData({
      dueDate: defaults.dueDate || getTodayDateString(),
      ...defaults,
    });
    setIsCreateModalOpen(true);
    setIsModalOpen(true);
    setIsNavVisible(false);
  }, [setIsModalOpen, setIsNavVisible]);

  const handleCreateTask = useCallback(async (taskData: Task | Omit<Task, 'uuid'>): Promise<void> => {
    if (!isAuthenticated && !isAuthLoading) {
      navigate('/login');
      throw new Error('Пользователь не аутентифицирован.');
    }
    if (isAuthLoading) {
      throw new Error('Аутентификация в процессе.');
    }

    const createData = { ...taskData } as Partial<Task>;
    delete createData.uuid;
    await createTaskMutation.mutateAsync(createData as Omit<Task, 'uuid'>);
  }, [createTaskMutation, isAuthLoading, isAuthenticated, navigate]);

  const createModalElement = useMemo(() => (
    <UnifiedTaskFormModal
      isOpen={isCreateModalOpen}
      onClose={closeCreateModal}
      onSubmit={handleCreateTask}
      onTaskUpsert={closeCreateModal}
      mode="create"
      initialTaskData={initialTaskData as Task}
      initialTaskType={initialTaskType}
    />
  ), [closeCreateModal, handleCreateTask, initialTaskData, initialTaskType, isCreateModalOpen]);

  return {
    isCreateModalOpen,
    openCreateModal,
    closeCreateModal,
    createModalElement,
  };
};
