// Загрузка Workbox через importScripts
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js'); // Используем CDN для Workbox 7

let ExpirationPlugin, cleanupOutdatedCaches, precacheAndRoute, registerRoute, setCatchHandler, NetworkFirst, StaleWhileRevalidate;

if (workbox) {
  workbox.setConfig({ debug: true }); // Включить логи для отладки, установить false для продакшена

  ExpirationPlugin = workbox.expiration.ExpirationPlugin;
  cleanupOutdatedCaches = workbox.precaching.cleanupOutdatedCaches;
  precacheAndRoute = workbox.precaching.precacheAndRoute;
  registerRoute = workbox.routing.registerRoute;
  setCatchHandler = workbox.routing.setCatchHandler;
  NetworkFirst = workbox.strategies.NetworkFirst;
  StaleWhileRevalidate = workbox.strategies.StaleWhileRevalidate;
} else {
  console.error('[SW] Workbox не удалось загрузить. Service Worker не будет работать корректно.');
}

// Плагин для предотвращения кэширования chrome-extension:// URL
const выборыChromeExtensionCachingPlugin = {
  cacheWillUpdate: async ({ request, response }) => {
    // Убедимся, что request и request.url существуют и request.url является строкой перед вызовом startsWith
    if (request && request.url && typeof request.url === 'string' && request.url.startsWith('chrome-extension://')) {
      console.log(`[SW] Предотвращение кэширования (через cacheWillUpdate) для: ${request.url}`);
      return null; // Не кэшировать
    }
    // В противном случае, вернуть response как есть (Workbox обработает его дальше)
    return response;
  },
};

// Константа для имени кэша API, если потребуется специфическое управление им вне Workbox стратегий
const API_CACHE_NAME = 'api-cache-v1'; // Переименовано из DYNAMIC_CACHE_NAME для ясности

// При установке SW, Workbox автоматически обрабатывает skipWaiting через опцию в vite.config.ts (registerType: 'autoUpdate')
// или это можно сделать явно здесь, если требуется.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Workbox будет управлять активацией и clients.claim() при использовании registerType: 'autoUpdate'
// или это можно сделать явно.
// self.addEventListener('activate', (event) => {
//   event.waitUntil(self.clients.claim());
// });

// Очистка старых кэшей Workbox
cleanupOutdatedCaches();

// Кэширование всех ассетов, определенных в vite.config.ts (globPatterns)
// self.__WB_MANIFEST инжектируется плагином vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST || []);

// Стратегия для API запросов: Stale-While-Revalidate
// Кэширует ответы от API, быстро отдает из кэша, если есть,
// и одновременно обновляет кэш в фоне.
registerRoute(
  ({ url, request }) => {
    // Игнорировать запросы chrome-extension
    if (request && request.url && request.url.startsWith('chrome-extension://')) {
      return false;
    }
    return url.pathname.startsWith('/api/');
  },
  new StaleWhileRevalidate({
    cacheName: API_CACHE_NAME,
    plugins: [
      выборыChromeExtensionCachingPlugin,
      new ExpirationPlugin({
        maxEntries: 50, // Максимальное количество записей в кэше
        maxAgeSeconds: 24 * 60 * 60, // 1 день
      }),
    ],
  })
);

// Стратегия для навигационных запросов: NetworkFirst
// Сначала пытается получить из сети, чтобы пользователь всегда видел свежую версию страницы.
// Если сеть недоступна, отдает из кэша.
// Фоллбэк на offline.html обрабатывается через setCatchHandler.
registerRoute(
  ({ request }) => {
    // Игнорировать запросы chrome-extension
    if (request && request.url && request.url.startsWith('chrome-extension://')) {
      return false;
    }
    return request.mode === 'navigate';
  },
  new NetworkFirst({
    cacheName: 'navigation-cache', // Отдельный кэш для навигационных ответов
    plugins: [
      выборыChromeExtensionCachingPlugin,
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 дней
      }),
    ],
  })
);

// Глобальный обработчик ошибок для всех запросов, которые не удалось выполнить
// (например, если пользователь офлайн и ресурс не в кэше).
// Для навигационных запросов это вернет offline.html.
setCatchHandler(async ({ event }) => {
  // Игнорировать запросы chrome-extension в обработчике ошибок
  if (event && event.request && event.request.url && event.request.url.startsWith('chrome-extension://')) {
    return Response.error(); // Просто вернуть ошибку, не пытаясь отдать offline.html или что-то кэшировать
  }

  // Возвращаем страницу offline.html для навигационных запросов
  if (event.request.destination === 'document' || event.request.mode === 'navigate') {
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
  }
  // Для других типов запросов (изображения, стили и т.д.)
  // можно вернуть стандартный Response.error() или специфический плейсхолдер, если есть.
  return Response.error();
});

console.log('[SW] Service Worker configured with Workbox.');