import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { offlineQueue } from '../lib/offlineQueue';
import {
  createNote as createNoteAPI,
  getAllNotes,
  getNoteByDate,
  updateNote as updateNoteAPI,
  type Note,
} from '../services/api';

/**
 * Query keys для заметок
 */
export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (filters?: any) => [...noteKeys.lists(), filters] as const,
  byDate: (date: string) => [...noteKeys.all, 'byDate', date] as const,
  details: () => [...noteKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...noteKeys.details(), uuid] as const,
};

/**
 * Хук для получения всех заметок
 */
export function useNotes() {
  return useQuery({
    queryKey: noteKeys.all,
    queryFn: getAllNotes,
    staleTime: 1000 * 60 * 5, // 5 минут
  });
}

/**
 * Хук для получения заметки по дате
 */
export function useNoteByDate(date: string) {
  return useQuery({
    queryKey: noteKeys.byDate(date),
    queryFn: () => getNoteByDate(date),
    enabled: !!date,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Хук для создания заметки с optimistic update
 */
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, content }: { date: string; content: string }) =>
      createNoteAPI(date, content),

    onMutate: async ({ date, content }) => {
      // Отменяем запросы для этой даты
      await queryClient.cancelQueries({ queryKey: noteKeys.byDate(date) });
      await queryClient.cancelQueries({ queryKey: noteKeys.all });

      const previousNoteByDate = queryClient.getQueryData<Note[]>(noteKeys.byDate(date));
      const previousAllNotes = queryClient.getQueryData<Note[]>(noteKeys.all);

      // Создаем оптимистичную заметку
      const optimisticNote: Note = {
        uuid: `temp-${Date.now()}`,
        date,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Обновляем кэш для конкретной даты
      queryClient.setQueryData<Note[]>(noteKeys.byDate(date), [optimisticNote]);

      // Обновляем кэш всех заметок
      if (previousAllNotes) {
        queryClient.setQueryData<Note[]>(noteKeys.all, [...previousAllNotes, optimisticNote]);
      }

      return { previousNoteByDate, previousAllNotes };
    },

    onSuccess: (_data, { date }) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.byDate(date) });
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
      toast.success('Заметка успешно создана!');
    },

    onError: (_error, { date, content }, context) => {
      if (context?.previousNoteByDate) {
        queryClient.setQueryData(noteKeys.byDate(date), context.previousNoteByDate);
      }
      if (context?.previousAllNotes) {
        queryClient.setQueryData(noteKeys.all, context.previousAllNotes);
      }

      if (!navigator.onLine) {
        offlineQueue.add({
          type: 'create',
          entity: 'note',
          data: { date, content },
        });
        toast.info('Изменения сохранены локально и будут синхронизированы позже');
      } else {
        toast.error('Не удалось создать заметку');
      }
    },

    onSettled: (_data, _error, { date }) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.byDate(date) });
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
}

/**
 * Хук для обновления заметки с optimistic update
 */
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uuid, content }: { uuid: string; content: string; date: string }) =>
      updateNoteAPI(uuid, content),

    onMutate: async ({ uuid, content, date }) => {
      await queryClient.cancelQueries({ queryKey: noteKeys.byDate(date) });
      await queryClient.cancelQueries({ queryKey: noteKeys.all });

      const previousNoteByDate = queryClient.getQueryData<Note[]>(noteKeys.byDate(date));
      const previousAllNotes = queryClient.getQueryData<Note[]>(noteKeys.all);

      // Обновляем заметку в кэше для конкретной даты
      if (previousNoteByDate) {
        queryClient.setQueryData<Note[]>(
          noteKeys.byDate(date),
          previousNoteByDate.map((note) =>
            note.uuid === uuid
              ? { ...note, content, updatedAt: new Date().toISOString() }
              : note
          )
        );
      }

      // Обновляем заметку в кэше всех заметок
      if (previousAllNotes) {
        queryClient.setQueryData<Note[]>(
          noteKeys.all,
          previousAllNotes.map((note) =>
            note.uuid === uuid
              ? { ...note, content, updatedAt: new Date().toISOString() }
              : note
          )
        );
      }

      return { previousNoteByDate, previousAllNotes };
    },

    onSuccess: (_data, { date }) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.byDate(date) });
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
      toast.success('Заметка успешно обновлена!');
    },

    onError: (_error, { uuid, content, date }, context) => {
      if (context?.previousNoteByDate) {
        queryClient.setQueryData(noteKeys.byDate(date), context.previousNoteByDate);
      }
      if (context?.previousAllNotes) {
        queryClient.setQueryData(noteKeys.all, context.previousAllNotes);
      }

      if (!navigator.onLine) {
        offlineQueue.add({
          type: 'update',
          entity: 'note',
          data: { uuid, content },
        });
        toast.info('Изменения сохранены локально и будут синхронизированы позже');
      } else {
        toast.error('Не удалось обновить заметку');
      }
    },

    onSettled: (_data, _error, { date }) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.byDate(date) });
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
}