import { QueryClient, onlineManager } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { get, set, del } from 'idb-keyval';

// Настраиваем React Query для отслеживания онлайн статуса
onlineManager.setEventListener((setOnline) => {
  // Устанавливаем текущий статус
  setOnline(navigator.onLine);

  // Создаём функции-обработчики
  const handleOnline = () => {
    console.log('[QueryClient] Network is ONLINE');
    setOnline(true);
  };
  const handleOffline = () => {
    console.log('[QueryClient] Network is OFFLINE');
    setOnline(false);
  };

  // Слушаем события браузера
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
});

// Создаем персистер для IndexedDB
const persister = {
  persistClient: async (client: any) => {
    await set('REACT_QUERY_OFFLINE_CACHE', client);
  },
  restoreClient: async () => {
    return await get('REACT_QUERY_OFFLINE_CACHE');
  },
  removeClient: async () => {
    await del('REACT_QUERY_OFFLINE_CACHE');
  },
};

// Конфигурация QueryClient с оптимальными настройками
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Данные считаются свежими 5 минут
      staleTime: 1000 * 60 * 5,
      // Кэш хранится 24 часа
      gcTime: 1000 * 60 * 60 * 24,
      // Обновлять при фокусе окна только если онлайн
      refetchOnWindowFocus: true,
      // Обновлять при восстановлении соединения
      refetchOnReconnect: true,
      // Не повторять запрос при отсутствии сети
      retry: (failureCount, error: any) => {
        // Не повторять если нет интернета
        if (error?.message?.includes('ERR_INTERNET_DISCONNECTED') ||
            error?.message?.includes('Network Error') ||
            error?.code === 'ERR_NETWORK') {
          return false;
        }
        // Не повторять для 4xx ошибок (клиентские ошибки)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Максимум 3 попытки для 5xx ошибок
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => {
        // Экспоненциальная задержка: 1s, 2s, 4s, но не более 30s
        return Math.min(1000 * 2 ** attemptIndex, 30000);
      },
      // Работать в режиме "online" - делать запросы только когда онлайн
      networkMode: 'online',
    },
    mutations: {
      // Не повторять мутации при сетевых ошибках
      retry: (failureCount, error: any) => {
        // Не повторять если нет интернета
        if (error?.message?.includes('ERR_INTERNET_DISCONNECTED') ||
            error?.message?.includes('Network Error') ||
            error?.code === 'ERR_NETWORK') {
          return false;
        }
        return failureCount < 1;
      },
      // Работать в режиме "online" - НЕ выполнять мутации при оффлайн
      // Они будут приостановлены до восстановления связи
      networkMode: 'online',
    },
  },
});

// Настройка персистентности
persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24 часа
  dehydrateOptions: {
    // Сохраняем только успешные запросы
    shouldDehydrateQuery: (query) => {
      return query.state.status === 'success';
    },
  },
});

export default queryClient;