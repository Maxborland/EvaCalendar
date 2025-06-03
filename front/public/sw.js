const APP_SHELL_CACHE_NAME = 'app-shell-cache-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v1';

// Список URL-адресов для кэширования в App Shell
// Важно: пути к JS/CSS бандлам (например, '/assets/index-XXXXXXXX.js', '/assets/index-YYYYYYYY.css')
// должны быть актуализированы после каждой сборки проекта Vite, так как Vite генерирует уникальные имена файлов с хэшами.
// Рассмотрите возможность использования инструментов/плагинов Vite для автоматической генерации этого списка (например, vite-plugin-pwa).
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/offline.html', // Страница-фоллбэк для офлайн режима
  // CSS - основные стили. ЗАМЕНИТЬ НА АКТУАЛЬНЫЕ ПУТИ ПОСЛЕ СБОРКИ!
  // '/assets/index-CSSHASH.css', // Пример
  '/src/index.css', // Оставлено для локальной разработки, если SW активен
  '/src/styles/theme.css', // Оставлено для локальной разработки, если SW активен
  // JS - основной бандл приложения. ЗАМЕНИТЬ НА АКТУАЛЬНЫЕ ПУТИ ПОСЛЕ СБОРКИ!
  // '/assets/index-JSHASH.js', // Пример
  // '/assets/vendor-JSHASH.js', // Пример
  '/manifest.json',
  '/favicon.ico',
  '/icons/Assets.xcassets/AppIcon.appiconset/180.png', // Apple touch icon
  // Добавьте сюда другие ключевые иконки из манифеста, если они используются для UI или splash
  '/icons/android/mipmap-xxxhdpi/icon.png', // 192x192 (для splash, если используется)
  '/icons/playstore.png', // 512x512 (для splash, если используется)
  '/splash.jpg' // Если используется
  // Шрифты не используются, поэтому не добавляем
];

// Установка Service Worker: кэширование App Shell
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(APP_SHELL_CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching App Shell...');
        // Используем addAll для атомарного добавления. Если один файл не загрузится, весь кэш не сохранится.
        // Для большей устойчивости можно использовать cache.add() для каждого URL в цикле и обрабатывать ошибки индивидуально.
        return cache.addAll(APP_SHELL_URLS.map(url => new Request(url, { cache: 'reload' })))
          .catch(error => {
            console.error('[SW] Failed to cache App Shell:', error);
            // Можно добавить логику для обработки частичного кэширования или повторной попытки
          });
      })
      .then(() => {
        console.log('[SW] App Shell cached successfully.');
        // Принудительная активация нового SW сразу после установки (если это необходимо)
        // return self.skipWaiting();
      })
  );
});

// Активация Service Worker: очистка старых кэшей
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== APP_SHELL_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Old caches deleted.');
        // Взять под контроль все открытые клиенты (страницы)
        return self.clients.claim();
      })
  );
});

// Обработка запросов (fetch event)
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Для навигационных запросов (HTML) и App Shell ресурсов - стратегия Cache First, then Network
  if (APP_SHELL_URLS.includes(url.pathname) || request.mode === 'navigate') {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // console.log('[SW] Serving from App Shell Cache:', request.url);
            return cachedResponse;
          }
          // console.log('[SW] Fetching from network (App Shell or navigation):', request.url);
          return fetch(request)
            .then(networkResponse => {
              // Опционально: можно кэшировать новые App Shell ресурсы, если они не были в списке,
              // но это требует осторожности, чтобы не закэшировать лишнего.
              return networkResponse;
            })
            .catch(error => {
              // Если сетевой запрос не удался (офлайн) и это навигационный запрос,
              // отображаем страницу offline.html
              console.log('[SW] Network request failed for navigation, serving offline page.', error);
              if (request.mode === 'navigate') {
                return caches.match('/offline.html');
              }
              // Для других типов запросов (не навигационных) просто пробрасываем ошибку,
              // если они не были найдены в кэше App Shell.
              // (API запросы обрабатываются отдельно ниже)
            });
        })
    );
  }
  // Для API запросов (например, /api/) - стратегия Stale-While-Revalidate
  else if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          const fetchPromise = fetch(request).then(networkResponse => {
            // console.log('[SW] Fetching API from network & caching:', request.url);
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
          // Возвращаем из кэша, если есть, иначе ждем ответа от сети
          // console.log(`[SW] API request: ${request.url}. Cached: ${!!cachedResponse}`);
          return cachedResponse || fetchPromise;
        });
      })
    );
  }
  // Для остальных запросов - просто выполняем сетевой запрос (например, сторонние ресурсы)
  // else {
  //   // console.log('[SW] Serving from network (other):', request.url);
  //   event.respondWith(fetch(request));
  // }
});

// Опционально: обработка skipWaiting для немедленной активации нового SW
// self.addEventListener('message', event => {
//   if (event.data && event.data.type === 'SKIP_WAITING') {
//     self.skipWaiting();
//   }
// });