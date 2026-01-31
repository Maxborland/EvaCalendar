import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { offlineQueue } from '../lib/offlineQueue';
import {
  createTask as createTaskAPI,
  deleteTask as deleteTaskAPI,
  duplicateTask as duplicateTaskAPI,
  getAllTasks,
  updateTask as updateTaskAPI,
  type Task,
} from '../services/api';

/**
 * Query keys для задач
 */
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

/**
 * Хук для получения всех задач
 */
export function useTasks() {
  return useQuery({
    queryKey: taskKeys.all,
    queryFn: getAllTasks,
    staleTime: 1000 * 60 * 5, // 5 минут
  });
}

/**
 * Хук для создания задачи с optimistic update
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newTask: Omit<Task, 'uuid'>) => createTaskAPI(newTask),

    // Optimistic update
    onMutate: async (newTask) => {
      // Отменяем текущие запросы задач
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      // Сохраняем предыдущее состояние
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.all);

      // Оптимистично обновляем кэш
      if (previousTasks) {
        const optimisticTask: Task = {
          ...newTask,
          uuid: `temp-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Task;

        queryClient.setQueryData<Task[]>(
          taskKeys.all,
          [...previousTasks, optimisticTask]
        );
      }

      return { previousTasks };
    },

    onSuccess: () => {
      toast.success('Задача успешно создана!');
    },

    // При ошибке откатываем изменения
    onError: (_error, newTask, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.all, context.previousTasks);
      }

      if (!navigator.onLine) {
        offlineQueue.add({
          type: 'create',
          entity: 'task',
          data: newTask,
        });
        toast.info('Изменения сохранены локально и будут синхронизированы позже');
      } else {
        toast.error('Не удалось создать задачу');
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * Хук для обновления задачи с optimistic update
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: Partial<Omit<Task, 'uuid'>> }) =>
      updateTaskAPI(uuid, data),

    // Optimistic update
    onMutate: async ({ uuid, data }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.all);

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          taskKeys.all,
          previousTasks.map((task) =>
            task.uuid === uuid
              ? { ...task, ...data, updatedAt: new Date().toISOString() }
              : task
          )
        );
      }

      return { previousTasks };
    },

    onSuccess: () => {
      toast.success('Задача успешно обновлена!');
    },

    onError: (_error, { uuid, data }, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.all, context.previousTasks);
      }

      if (!navigator.onLine) {
        offlineQueue.add({
          type: 'update',
          entity: 'task',
          data: { uuid, ...data },
        });
        toast.info('Изменения сохранены локально и будут синхронизированы позже');
      } else {
        toast.error('Не удалось обновить задачу');
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * Хук для удаления задачи с optimistic update
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => deleteTaskAPI(uuid),

    // Optimistic update
    onMutate: async (uuid) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.all);

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          taskKeys.all,
          previousTasks.filter((task) => task.uuid !== uuid)
        );
      }

      return { previousTasks };
    },

    onSuccess: () => {
      toast.success('Задача успешно удалена!');
    },

    onError: (_error, uuid, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.all, context.previousTasks);
      }

      if (!navigator.onLine) {
        offlineQueue.add({
          type: 'delete',
          entity: 'task',
          data: { uuid },
        });
        toast.info('Удаление сохранено локально и будет синхронизировано позже');
      } else {
        toast.error('Не удалось удалить задачу');
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * Хук для дублирования задачи с optimistic update
 */
export function useDuplicateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => duplicateTaskAPI(uuid),

    onMutate: async (uuid) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });

      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.all);
      const taskToDuplicate = previousTasks?.find((task) => task.uuid === uuid);

      if (previousTasks && taskToDuplicate) {
        const duplicatedTask: Task = {
          ...taskToDuplicate,
          uuid: `temp-duplicate-${Date.now()}`,
          title: `${taskToDuplicate.title} (копия)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        queryClient.setQueryData<Task[]>(taskKeys.all, [...previousTasks, duplicatedTask]);
      }

      return { previousTasks };
    },

    onSuccess: () => {
      toast.success('Задача успешно дублирована!');
    },

    onError: (_error, _uuid, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.all, context.previousTasks);
      }
      toast.error('Не удалось дублировать задачу');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}