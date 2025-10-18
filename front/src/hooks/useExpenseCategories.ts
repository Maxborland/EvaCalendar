import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { offlineQueue } from '../lib/offlineQueue';
import {
  createExpenseCategory as createCategoryAPI,
  deleteExpenseCategory as deleteCategoryAPI,
  getExpenseCategories,
  updateExpenseCategory as updateCategoryAPI,
  type ExpenseCategory,
} from '../services/api';

/**
 * Query keys для категорий расходов
 */
export const expenseCategoryKeys = {
  all: ['expenseCategories'] as const,
  lists: () => [...expenseCategoryKeys.all, 'list'] as const,
  list: (filters?: any) => [...expenseCategoryKeys.lists(), filters] as const,
  details: () => [...expenseCategoryKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...expenseCategoryKeys.details(), uuid] as const,
};

/**
 * Хук для получения всех категорий расходов
 */
export function useExpenseCategories() {
  return useQuery({
    queryKey: expenseCategoryKeys.all,
    queryFn: getExpenseCategories,
    staleTime: 1000 * 60 * 10, // 10 минут (категории изменяются редко)
  });
}

/**
 * Хук для создания категории расходов с optimistic update
 */
export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryName: string) => createCategoryAPI(categoryName),

    onMutate: async (categoryName) => {
      await queryClient.cancelQueries({ queryKey: expenseCategoryKeys.all });

      const previousCategories = queryClient.getQueryData<ExpenseCategory[]>(
        expenseCategoryKeys.all
      );

      if (previousCategories) {
        const optimisticCategory: ExpenseCategory = {
          uuid: `temp-${Date.now()}`,
          categoryName,
        };

        queryClient.setQueryData<ExpenseCategory[]>(expenseCategoryKeys.all, [
          ...previousCategories,
          optimisticCategory,
        ]);
      }

      return { previousCategories };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.all });
      toast.success('Категория успешно создана!');
    },

    onError: (_error, categoryName, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(expenseCategoryKeys.all, context.previousCategories);
      }

      if (!navigator.onLine) {
        offlineQueue.add({
          type: 'create',
          entity: 'category',
          data: { categoryName },
        });
        toast.info('Изменения сохранены локально и будут синхронизированы позже');
      } else {
        toast.error('Не удалось создать категорию');
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.all });
    },
  });
}

/**
 * Хук для обновления категории расходов с optimistic update
 */
export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uuid, categoryName }: { uuid: string; categoryName: string }) =>
      updateCategoryAPI(uuid, categoryName),

    onMutate: async ({ uuid, categoryName }) => {
      await queryClient.cancelQueries({ queryKey: expenseCategoryKeys.all });

      const previousCategories = queryClient.getQueryData<ExpenseCategory[]>(
        expenseCategoryKeys.all
      );

      if (previousCategories) {
        queryClient.setQueryData<ExpenseCategory[]>(
          expenseCategoryKeys.all,
          previousCategories.map((cat) =>
            cat.uuid === uuid ? { ...cat, categoryName } : cat
          )
        );
      }

      return { previousCategories };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.all });
      toast.success('Категория успешно обновлена!');
    },

    onError: (_error, { uuid, categoryName }, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(expenseCategoryKeys.all, context.previousCategories);
      }

      if (!navigator.onLine) {
        offlineQueue.add({
          type: 'update',
          entity: 'category',
          data: { uuid, categoryName },
        });
        toast.info('Изменения сохранены локально и будут синхронизированы позже');
      } else {
        toast.error('Не удалось обновить категорию');
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.all });
    },
  });
}

/**
 * Хук для удаления категории расходов с optimistic update
 */
export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => deleteCategoryAPI(uuid),

    onMutate: async (uuid) => {
      await queryClient.cancelQueries({ queryKey: expenseCategoryKeys.all });

      const previousCategories = queryClient.getQueryData<ExpenseCategory[]>(
        expenseCategoryKeys.all
      );

      if (previousCategories) {
        queryClient.setQueryData<ExpenseCategory[]>(
          expenseCategoryKeys.all,
          previousCategories.filter((cat) => cat.uuid !== uuid)
        );
      }

      return { previousCategories };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.all });
      toast.success('Категория успешно удалена!');
    },

    onError: (_error, uuid, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(expenseCategoryKeys.all, context.previousCategories);
      }

      if (!navigator.onLine) {
        offlineQueue.add({
          type: 'delete',
          entity: 'category',
          data: { uuid },
        });
        toast.info('Удаление сохранено локально и будет синхронизировано позже');
      } else {
        toast.error('Не удалось удалить категорию');
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.all });
    },
  });
}