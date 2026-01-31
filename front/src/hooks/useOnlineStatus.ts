import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { offlineQueue, type QueuedMutation } from '../lib/offlineQueue';
import {
  createTask,
  updateTask,
  deleteTask,
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
    if (type === 'create') await createTask(data);
    else if (type === 'update') {
      const { uuid, ...rest } = data;
      await updateTask(uuid, rest);
    } else if (type === 'delete') await deleteTask(data.uuid);
  } else if (entity === 'child') {
    if (type === 'create') await addChild(data);
    else if (type === 'update') {
      const { uuid, ...rest } = data;
      await updateChild(uuid, rest);
    } else if (type === 'delete') await deleteChild(data.uuid);
  } else if (entity === 'category') {
    if (type === 'create') await createExpenseCategory(data.categoryName);
    else if (type === 'update') await updateExpenseCategory(data.uuid, data.categoryName);
    else if (type === 'delete') await deleteExpenseCategory(data.uuid);
  } else if (entity === 'note') {
    if (type === 'create') await createNote(data.dateString, data.content);
    else if (type === 'update') await updateNote(data.uuid, data.content);
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
      if (currentStatus !== isOnline) {
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
  }, [queryClient, isOnline]);

  return isOnline;
}