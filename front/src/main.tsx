import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MultiBackend } from 'react-dnd-multi-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { createRoot } from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App.tsx';
import LoadingAnimation from './components/LoadingAnimation.tsx'; // Импортируем компонент анимации
import './index.css';

// Создаем "MultiBackend"
const MyMultiBackend = MultiBackend;

const backends = [
  {
    id: 'html5', // Добавлен id
    backend: HTML5Backend
  },
  {
    id: 'touch', // Добавлен id
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
    <DndProvider backend={MyMultiBackend} options={{ backends: backends }}>
      <App />
    </DndProvider>
    <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} limit={1} theme="dark" pauseOnFocusLoss draggable pauseOnHover />
  </>,
);

// Render LoadingAnimation into the splashscreen div
const splashScreenElement = document.getElementById('splashscreen');
if (splashScreenElement) {
  const splashRoot = createRoot(splashScreenElement);
  splashRoot.render(<LoadingAnimation />);
}

// Hide splashscreen after app is loaded
const splashScreen = document.getElementById('splashscreen'); // Переменная splashScreen уже объявлена выше, но здесь она нужна для логики скрытия
if (splashScreen) {
  // Wait for a bit to ensure content is loaded, then fade out
  setTimeout(() => {
    splashScreen.style.opacity = '0';
    splashScreen.style.transition = 'opacity 0.5s ease-out';
    setTimeout(() => {
      if (splashScreen) { // Дополнительная проверка, так как splashScreenElement мог быть удален
        splashScreen.style.display = 'none';
      }
    }, 500); // Corresponds to the transition duration
  }, 1500); // Увеличим задержку, чтобы анимация успела показаться
}

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}
