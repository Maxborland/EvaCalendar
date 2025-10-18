import { get, set } from 'idb-keyval';
import { toast } from 'react-toastify';

export interface QueuedMutation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'task' | 'child' | 'category' | 'note';
  data: any;
  timestamp: number;
  retryCount: number;
}

const QUEUE_KEY = 'offline_mutation_queue';
const MAX_RETRY_COUNT = 3;

/**
 * Сервис для управления очередью оффлайн запросов
 * Работает совместно с React Query для обеспечения надежной синхронизации
 */
class OfflineQueueService {
  private queue: QueuedMutation[] = [];
  private isProcessing = false;

  /**
   * Инициализация очереди из IndexedDB
   */
  async init(): Promise<void> {
    try {
      const savedQueue = await get<QueuedMutation[]>(QUEUE_KEY);
      if (savedQueue && Array.isArray(savedQueue)) {
        this.queue = savedQueue;
      }
    } catch (error) {
      console.error('[OfflineQueue] Ошибка загрузки очереди:', error);
      this.queue = [];
    }
  }

  /**
   * Добавить мутацию в очередь
   */
  async add(mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const queuedMutation: QueuedMutation = {
      ...mutation,
      id: `${mutation.entity}-${mutation.type}-${Date.now()}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(queuedMutation);
    await this.saveQueue();

    console.log('[OfflineQueue] Добавлена мутация в очередь:', queuedMutation);
  }

  /**
   * Удалить мутацию из очереди
   */
  async remove(id: string): Promise<void> {
    this.queue = this.queue.filter(m => m.id !== id);
    await this.saveQueue();
    console.log('[OfflineQueue] Удалена мутация из очереди:', id);
  }

  /**
   * Получить текущую очередь
   */
  getQueue(): QueuedMutation[] {
    return [...this.queue];
  }

  /**
   * Получить количество мутаций в очереди
   */
  getCount(): number {
    return this.queue.length;
  }

  /**
   * Обработать очередь (выполнить все отложенные мутации)
   */
  async processQueue(executeMutation: (mutation: QueuedMutation) => Promise<void>): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log('[OfflineQueue] Начинается обработка очереди, мутаций:', this.queue.length);

    const mutations = [...this.queue];

    for (const mutation of mutations) {
      try {
        await executeMutation(mutation);
        await this.remove(mutation.id);
        console.log('[OfflineQueue] Успешно выполнена мутация:', mutation.id);
      } catch (error) {
        mutation.retryCount++;

        if (mutation.retryCount >= MAX_RETRY_COUNT) {
          console.error('[OfflineQueue] Превышен лимит попыток для мутации:', mutation.id, error);
          await this.remove(mutation.id);
          toast.error(`Не удалось синхронизировать изменение (${mutation.entity}). Попробуйте еще раз.`);
        } else {
          console.warn('[OfflineQueue] Ошибка выполнения мутации (попытка ${mutation.retryCount}):', mutation.id, error);
          await this.saveQueue();
        }
      }
    }

    this.isProcessing = false;

    if (this.queue.length === 0) {
      console.log('[OfflineQueue] Очередь успешно обработана');
      toast.success('Все изменения синхронизированы');
    }
  }

  /**
   * Очистить всю очередь
   */
  async clear(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    console.log('[OfflineQueue] Очередь очищена');
  }

  /**
   * Сохранить очередь в IndexedDB
   */
  private async saveQueue(): Promise<void> {
    try {
      await set(QUEUE_KEY, this.queue);
    } catch (error) {
      console.error('[OfflineQueue] Ошибка сохранения очереди:', error);
    }
  }
}

// Экспортируем singleton instance
export const offlineQueue = new OfflineQueueService();

// Инициализируем очередь при загрузке модуля
offlineQueue.init().catch(error => {
  console.error('[OfflineQueue] Ошибка инициализации:', error);
});