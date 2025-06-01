import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MultiBackend } from 'react-dnd-multi-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { createRoot } from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App.tsx';
import './index.css';
import './momentConfig.ts'; // Импорт конфигурации Moment.js

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
    <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} limit={2} theme="dark" pauseOnFocusLoss draggable pauseOnHover />
  </>,
)
