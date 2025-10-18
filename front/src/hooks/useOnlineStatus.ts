import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

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