import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { offlineQueue, type QueuedMutation } from '../lib/offlineQueue';
import {
  createTask,
  updateTask,
  deleteTask,
  type Child,
  type Task,
} from '../services/api';
import {
  addChild,
  updateChild,
  deleteChild,
} from '../services/api';
import {
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from '../services/api';
import {
  createNote,
  updateNote,
} from '../services/api';

async function executeMutation(mutation: QueuedMutation): Promise<void> {
  const { type, entity, data } = mutation;

  if (entity === 'task') {
    const taskData = data as Partial<Task> & { uuid?: string };
    if (type === 'create') await createTask(taskData as Omit<Task, 'uuid'>);
    else if (type === 'update') {
      const { uuid, ...rest } = taskData;
      if (!uuid) return;
      await updateTask(uuid, rest);
    } else if (type === 'delete' && taskData.uuid) await deleteTask(taskData.uuid);
  } else if (entity === 'child') {
    const childData = data as Partial<Child> & { uuid?: string };
    if (type === 'create') await addChild(childData as Omit<Child, 'uuid'>);
    else if (type === 'update') {
      const { uuid, ...rest } = childData;
      if (!uuid) return;
      await updateChild(uuid, rest as Child);
    } else if (type === 'delete' && childData.uuid) await deleteChild(childData.uuid);
  } else if (entity === 'category') {
    const categoryData = data as { uuid?: string; categoryName?: string };
    if (type === 'create' && categoryData.categoryName) await createExpenseCategory(categoryData.categoryName);
    else if (type === 'update' && categoryData.uuid && categoryData.categoryName) await updateExpenseCategory(categoryData.uuid, categoryData.categoryName);
    else if (type === 'delete' && categoryData.uuid) await deleteExpenseCategory(categoryData.uuid);
  } else if (entity === 'note') {
    const noteData = data as { uuid?: string; dateString?: string; content?: string };
    if (type === 'create' && noteData.dateString && noteData.content !== undefined) await createNote(noteData.dateString, noteData.content);
    else if (type === 'update' && noteData.uuid && noteData.content !== undefined) await updateNote(noteData.uuid, noteData.content);
  }
}

/**
 * Хук для отслеживания состояния подключения к интернету
 * Автоматически возобновляет приостановленные мутации при восстановлении связи
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const queryClient = useQueryClient();
  const isOnlineRef = useRef(isOnline);

  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Возобновляем приостановленные мутации
      queryClient.resumePausedMutations().then(() => {
        // Обновляем все queries после успешной синхронизации
        queryClient.invalidateQueries();
      });
      // Обрабатываем очередь оффлайн-мутаций
      offlineQueue.processQueue(executeMutation);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Добавляем слушатели событий
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Дополнительная проверка каждые 30 секунд
    const intervalId = setInterval(() => {
      const currentStatus = navigator.onLine;
      if (currentStatus !== isOnlineRef.current) {
        if (currentStatus) {
          handleOnline();
        } else {
          handleOffline();
        }
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [queryClient]);

  return isOnline;
}
