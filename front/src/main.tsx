import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MultiBackend } from 'react-dnd-multi-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { createRoot } from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App.tsx';
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

// Hide splashscreen after app is loaded
const splashScreen = document.getElementById('splashscreen');
if (splashScreen) {
  // Wait for a bit to ensure content is loaded, then fade out
  setTimeout(() => {
    splashScreen.style.opacity = '0';
    splashScreen.style.transition = 'opacity 0.5s ease-out';
    setTimeout(() => {
      splashScreen.style.display = 'none';
    }, 500); // Corresponds to the transition duration
  }, 500); // Adjust this delay as needed
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
