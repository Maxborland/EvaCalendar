import { useEffect, useRef, useState } from 'react'; // Добавляем импорты
import { createBrowserRouter, Outlet, type RouteObject, RouterProvider, useNavigation } from 'react-router-dom';
import LoadingAnimation from './components/LoadingAnimation'; // Импортируем компонент анимации
import PrivateRoute from './components/PrivateRoute'; // Добавляем импорт PrivateRoute
import WeekView from './components/WeekView';
import { NavProvider } from './context/NavContext';
import LoginPage from './pages/Auth/LoginPage'; // Добавляем импорт LoginPage
import RegistrationPage from './pages/Auth/RegistrationPage'; // Добавляем импорт RegistrationPage
import ChangePasswordPage from './pages/ChangePasswordPage'; // Импортируем страницу смены пароля
import ChildCardsSettingsPage from './pages/ChildCardsSettingsPage';
import DashboardPage from './pages/DashboardPage'; // Добавляем импорт DashboardPage
import DayDetailsPage from './pages/DayDetailsPage'; // Импортируем новую страницу
import ExpenseCategoriesSettingsPage from './pages/ExpenseCategoriesSettingsPage';
import NoteDetailsPage from './pages/NoteDetailsPage'; // Импортируем страницу заметок
import SettingsPage from './pages/SettingsPage';
import { getAllTasks, getDailySummary, getNoteByDate, getTasksForDay } from './services/api'; // Импортируем необходимые API функции, включая getNoteByDate

// Компонент для отображения глобального индикатора загрузки страницы
const PageLoader: React.FC = () => {
  const navigation = useNavigation();
  const startTime = useRef<number | null>(null);
  const [finalSpeed, setFinalSpeed] = useState(1);

  const animationNominalFrames = 196.000007983244;
  const animationFps = 29.9700012207031;
  const animationNominalDurationSeconds = animationNominalFrames / animationFps; // Примерно 6.54 сек

  useEffect(() => {
    if (navigation.state === 'loading') {
      startTime.current = Date.now();
    } else if (navigation.state === 'idle' && startTime.current !== null) {
      const endTime = Date.now();
      const loadDuration = endTime - startTime.current;
      startTime.current = null; // Сбрасываем для следующей загрузки

      const loadDurationSeconds = loadDuration / 1000;

      let calculatedSpeed;
      if (loadDurationSeconds > 0.1) { // Избегаем деления на ноль или слишком малое значение
        calculatedSpeed = animationNominalDurationSeconds / loadDurationSeconds;
      } else {
        calculatedSpeed = 3.0; // Используем максимальную скорость, если загрузка очень быстрая
      }

      const newFinalSpeed = Math.max(0.5, Math.min(calculatedSpeed, 3.0));
      setFinalSpeed(newFinalSpeed);
    }
  }, [navigation.state, animationNominalDurationSeconds]);

  // Определяем, должен ли лоадер быть видим.
  // Он должен быть видим, когда navigation.state === 'loading' или 'submitting'
  // CSS transition позаботится о плавности.
  // Обертка всегда рендерится, чтобы анимация затухания работала.
  // Видимость контролируется классами CSS.
  const isLoading = navigation.state === 'loading' || navigation.state === 'submitting';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(214, 239, 199, 1)', // Сделаем фон чуть прозрачнее для эффекта
        zIndex: 9999,
        // pointerEvents управляются через CSS для лучшей организации
      }}
      className={isLoading ? 'loader-visible' : 'loader-hidden'}
    >
      <LoadingAnimation speed={finalSpeed} />
    </div>
  );
};

// Корневой компонент макета для PageLoader и NavProvider
const RootLayout: React.FC = () => {
  return (
    <NavProvider>
      <PageLoader />
      <div className="pt-20"> {/* Добавляем padding-top для компенсации высоты TopNavigator */}
        <Outlet /> {/* Здесь будут рендериться дочерние маршруты */}
      </div>
    </NavProvider>
  );
};

// Loader для WeekView
const weekViewLoader = async () => {
  try {
    const tasks = await getAllTasks();
    return { tasks };
  } catch (error) {
    throw error; // Перебрасываем ошибку, чтобы ее поймал ErrorBoundary роутера
  }
};

// Loader для DayDetailsPage
const dayDetailsLoader = async ({ params }: any) => {
  const dateString = params.dateString;
  if (!dateString) {
    throw new Response("Bad Request: dateString is required", { status: 400 });
  }
  try {
    const tasks = await getTasksForDay(dateString);
    const summary = await getDailySummary(dateString);
    return { tasks, summary, dateString }; // Возвращаем dateString для использования в компоненте, если нужно
  } catch (error) {
    // Обработка ошибок, например, если API возвращает 404 для несуществующей даты
    console.error("Error in dayDetailsLoader:", error);
    // Можно выбросить ошибку, чтобы react-router отобразил ErrorBoundary
    // или вернуть специальный объект/статус
    throw new Response("Not Found or Error Loading Data", { status: 404 }); // Пример
  }
};

// Loader для NoteDetailsPage
const noteDetailsLoader = async ({ params }: any) => {
  const date = params.date;
  if (!date) {
    throw new Response("Bad Request: date is required", { status: 400 });
  }
  try {
    const notes = await getNoteByDate(date); // API возвращает Note[]
    // Мы ожидаем одну заметку или ее отсутствие. Берем первую, если есть.
    const note = notes && notes.length > 0 ? notes[0] : null;
    return { note, date }; // Возвращаем заметку и дату
  } catch (error) {
    console.error("Error in noteDetailsLoader:", error);
    throw new Response("Not Found or Error Loading Note Data", { status: 404 });
  }
};

const routes: RouteObject[] = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegistrationPage />,
  },
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true, // Главная страница
        element: (
          <PrivateRoute>
            <WeekView />
          </PrivateRoute>
        ),
        loader: weekViewLoader, // loader остается на том же уровне
      },
      {
        path: "dashboard",
        element: (
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        ),
        // Если для DashboardPage нужен loader, его можно добавить здесь
        // loader: dashboardLoader,
      },
      {
        path: "settings",
        element: (
          <PrivateRoute>
            <SettingsPage />
          </PrivateRoute>
        ),
        children: [
          {
            path: "expense-categories",
            element: <ExpenseCategoriesSettingsPage />,
          },
          {
            path: "child-cards",
            element: <ChildCardsSettingsPage />,
          },
        ],
      },
      {
        path: "day/:dateString",
        element: (
          <PrivateRoute>
            <DayDetailsPage />
          </PrivateRoute>
        ),
        loader: dayDetailsLoader, // loader остается на том же уровне
      },
      {
        path: "notes/:date",
        element: (
          <PrivateRoute>
            <NoteDetailsPage />
          </PrivateRoute>
        ),
        loader: noteDetailsLoader, // loader остается на том же уровне
      },
      {
        path: "change-password",
        element: (
          <PrivateRoute>
            <ChangePasswordPage />
          </PrivateRoute>
        ),
      },
    ],
  },
];

const router = createBrowserRouter(routes);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
