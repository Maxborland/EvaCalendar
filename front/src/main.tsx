import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MultiBackend } from 'react-dnd-multi-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { createRoot } from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App.tsx';
import LoadingAnimation from './components/LoadingAnimation.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import './index.css';
import { queryClient } from './lib/queryClient.ts';

const MyMultiBackend = MultiBackend;

const backends = [
  {
    id: 'html5',
    backend: HTML5Backend
  },
  {
    id: 'touch',
    backend: TouchBackend,
    options: { enableTouchEvents: true },
    preview: true,
    transition: {
      drag: 'touchstart',
      drop: 'touchend',
    },
  },
];

createRoot(document.getElementById('root')!).render(
  <>
    <QueryClientProvider client={queryClient}>
      <DndProvider backend={MyMultiBackend} options={{ backends: backends }}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </DndProvider>
      <ReactQueryDevtools initialIsOpen={false} />
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} limit={1} theme="dark" pauseOnFocusLoss draggable pauseOnHover />
    </QueryClientProvider>
  </>,
);

const splashScreen = document.getElementById('splashscreen');
if (splashScreen) {
  const splashRoot = createRoot(splashScreen);
  splashRoot.render(<LoadingAnimation />);

  setTimeout(() => {
    splashScreen.style.opacity = '0';
    splashScreen.style.transition = 'opacity 0.5s ease-out';
    setTimeout(() => {
      if (splashScreen) {
        splashScreen.style.display = 'none';
      }
    }, 500);
  }, 1500);
}

// Service Worker: можно отключить через VITE_DISABLE_SW=true в .env
const disableSW = import.meta.env.VITE_DISABLE_SW === 'true';

if ('serviceWorker' in navigator) {
  if (disableSW) {
    // Удаляем все существующие service workers (однократно)
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
    });

    // Очищаем все кэши (однократно)
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
  } else {
    // Регистрируем service worker только если он еще не зарегистрирован
    navigator.serviceWorker.getRegistrations().then(registrations => {
      const swRegistered = registrations.some(reg => reg.active?.scriptURL.includes('sw.js'));

      if (!swRegistered) {
        navigator.serviceWorker.register('/sw.js')
          .catch(error => {
            console.error('[SW] Ошибка регистрации Service Worker:', error);
          });
      }
    });
  }
}
