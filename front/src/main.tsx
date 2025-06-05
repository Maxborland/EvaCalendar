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
    <DndProvider backend={MyMultiBackend} options={{ backends: backends }}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </DndProvider>
    <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} limit={1} theme="dark" pauseOnFocusLoss draggable pauseOnHover />
  </>,
);

const splashScreenElement = document.getElementById('splashscreen');
if (splashScreenElement) {
  const splashRoot = createRoot(splashScreenElement);
  splashRoot.render(<LoadingAnimation />);
}

const splashScreen = document.getElementById('splashscreen');
if (splashScreen) {
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        // ServiceWorker registration successful
      })
      .catch(error => {
        // ServiceWorker registration failed
      });
  });
}
