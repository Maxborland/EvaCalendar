import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { offlineQueue } from '../lib/offlineQueue';
import {
  addChild as addChildAPI,
  deleteChild as deleteChildAPI,
  getAllChildren,
  getChildByUuid,
  updateChild as updateChildAPI,
  type Child,
} from '../services/api';

/**
 * Query keys для детей
 */
export const childKeys = {
  all: ['children'] as const,
  lists: () => [...childKeys.all, 'list'] as const,
  list: (filters?: any) => [...childKeys.lists(), filters] as const,
  details: () => [...childKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...childKeys.details(), uuid] as const,
};

/**
 * Хук для получения всех детей
 */
export function useChildren() {
  return useQuery({
    queryKey: childKeys.all,
    queryFn: getAllChildren,
    staleTime: 1000 * 60 * 5, // 5 минут
  });
}

/**
 * Хук для получения ребенка по UUID
 */
export function useChild(uuid: string) {
  return useQuery({
    queryKey: childKeys.detail(uuid),
    queryFn: () => getChildByUuid(uuid),
    enabled: !!uuid,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Хук для добавления ребенка с optimistic update
 */
export function useAddChild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newChild: Omit<Child, 'uuid'>) => addChildAPI(newChild),

    onMutate: async (newChild) => {
      await queryClient.cancelQueries({ queryKey: childKeys.all });

      const previousChildren = queryClient.getQueryData<Child[]>(childKeys.all);

      if (previousChildren) {
        const optimisticChild: Child = {
          ...newChild,
          uuid: `temp-${Date.now()}`,
        } as Child;

        queryClient.setQueryData<Child[]>(childKeys.all, [...previousChildren, optimisticChild]);
      }

      return { previousChildren };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: childKeys.all });
      toast.success('Карточка ребенка успешно добавлена!');
    },

    onError: (_error, newChild, context) => {
      if (context?.previousChildren) {
        queryClient.setQueryData(childKeys.all, context.previousChildren);
      }

      if (!navigator.onLine) {
        offlineQueue.add({
          type: 'create',
          entity: 'child',
          data: newChild,
        });
        toast.info('Изменения сохранены локально и будут синхронизированы позже');
      } else {
        toast.error('Не удалось добавить карточку ребенка');
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: childKeys.all });
    },
  });
}

/**
 * Хук для обновления ребенка с optimistic update
 */
export function useUpdateChild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: Child }) =>
      updateChildAPI(uuid, data),

    onMutate: async ({ uuid, data }) => {
      await queryClient.cancelQueries({ queryKey: childKeys.all });

      const previousChildren = queryClient.getQueryData<Child[]>(childKeys.all);

      if (previousChildren) {
        queryClient.setQueryData<Child[]>(
          childKeys.all,
          previousChildren.map((child) => (child.uuid === uuid ? { ...data, uuid } : child))
        );
      }

      return { previousChildren };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: childKeys.all });
      toast.success('Карточка ребенка успешно обновлена!');
    },

    onError: (_error, { uuid, data }, context) => {
      if (context?.previousChildren) {
        queryClient.setQueryData(childKeys.all, context.previousChildren);
      }

      if (!navigator.onLine) {
        offlineQueue.add({
          type: 'update',
          entity: 'child',
          data: { ...data, uuid },
        });
        toast.info('Изменения сохранены локально и будут синхронизированы позже');
      } else {
        toast.error('Не удалось обновить карточку ребенка');
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: childKeys.all });
    },
  });
}

/**
 * Хук для удаления ребенка с optimistic update
 */
export function useDeleteChild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => deleteChildAPI(uuid),

    onMutate: async (uuid) => {
      await queryClient.cancelQueries({ queryKey: childKeys.all });

      const previousChildren = queryClient.getQueryData<Child[]>(childKeys.all);

      if (previousChildren) {
        queryClient.setQueryData<Child[]>(
          childKeys.all,
          previousChildren.filter((child) => child.uuid !== uuid)
        );
      }

      return { previousChildren };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: childKeys.all });
      toast.success('Карточка ребенка успешно удалена!');
    },

    onError: (_error, uuid, context) => {
      if (context?.previousChildren) {
        queryClient.setQueryData(childKeys.all, context.previousChildren);
      }

      if (!navigator.onLine) {
        offlineQueue.add({
          type: 'delete',
          entity: 'child',
          data: { uuid },
        });
        toast.info('Удаление сохранено локально и будет синхронизировано позже');
      } else {
        toast.error('Не удалось удалить карточку ребенка');
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: childKeys.all });
    },
  });
}