import { useEffect, useRef, useState } from 'react';
import { createBrowserRouter, Outlet, type RouteObject, RouterProvider, useNavigation, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingAnimation from './components/LoadingAnimation';
import PrivateRoute from './components/PrivateRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute'; // Импорт PublicOnlyRoute
import WeekView from './components/WeekView';
import { NavProvider } from './context/NavContext';
import LoginPage from './pages/Auth/LoginPage';
import RegistrationPage from './pages/Auth/RegistrationPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ChildCardsSettingsPage from './pages/ChildCardsSettingsPage';
import DashboardPage from './pages/DashboardPage';
import DayDetailsPage from './pages/DayDetailsPage';
import ExpenseCategoriesSettingsPage from './pages/ExpenseCategoriesSettingsPage';
import NoteDetailsPage from './pages/NoteDetailsPage';
import NotFoundPage from './pages/NotFoundPage'; // Импорт страницы 404
import StatisticsPage from './pages/StatisticsPage';
import ProfilePage from './pages/ProfilePage'; // Импортируем созданную страницу профиля
import SettingsPage from './pages/SettingsPage';
import FamilySettingsPage from './pages/FamilySettingsPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';
import { getNoteByDate } from './services/api';

const PageLoader: React.FC = () => {
  const navigation = useNavigation();
  const startTime = useRef<number | null>(null);
  const [finalSpeed, setFinalSpeed] = useState(1);

  const animationNominalFrames = 196.000007983244;
  const animationFps = 29.9700012207031;
  const animationNominalDurationSeconds = animationNominalFrames / animationFps;

  useEffect(() => {
    if (navigation.state === 'loading') {
      startTime.current = Date.now();
    } else if (navigation.state === 'idle' && startTime.current !== null) {
      const endTime = Date.now();
      const loadDuration = endTime - startTime.current;
      startTime.current = null;

      const loadDurationSeconds = loadDuration / 1000;

      let calculatedSpeed;
      if (loadDurationSeconds > 0.1) {
        calculatedSpeed = animationNominalDurationSeconds / loadDurationSeconds;
      } else {
        calculatedSpeed = 3.0;
      }

      const newFinalSpeed = Math.max(0.5, Math.min(calculatedSpeed, 3.0));
      setFinalSpeed(newFinalSpeed);
    }
  }, [navigation.state, animationNominalDurationSeconds]);

  const isLoading = navigation.state === 'loading' || navigation.state === 'submitting';

  return (
    <div
      className={`fixed inset-0 w-screen h-screen flex justify-center items-center bg-[rgba(214,239,199,1)] z-[9999] ${isLoading ? 'loader-visible' : 'loader-hidden'}`}
    >
      <LoadingAnimation speed={finalSpeed} />
    </div>
  );
};

const RootLayout: React.FC = () => {
  return (
    <>
      <PageLoader />
        <Outlet />
    </>
  );
};



const noteDetailsLoader = async ({ params }: { params: Record<string, string | undefined> }) => {
  const date = params.date;
  if (!date) {
    throw new Response("Bad Request: date is required", { status: 400 });
  }
  try {
    const notes = await getNoteByDate(date);
    const note = notes && notes.length > 0 ? notes[0] : null;
    return { note, date };
  } catch (error) {
    throw new Response("Not Found or Error Loading Note Data", { status: 404 });
  }
};

const routes: RouteObject[] = [
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegistrationPage />,
      },
    ]
  },
  {
    path: "/",
    element: (
      <NavProvider>
        <RootLayout />
      </NavProvider>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: (
          <PrivateRoute>
            <WeekView />
          </PrivateRoute>
        ),
      },
      {
        path: "dashboard",
        element: (
          <PrivateRoute allowedRoles={['admin']}>
            <DashboardPage />
          </PrivateRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <PrivateRoute>
            <SettingsPage />
          </PrivateRoute>
        ),
        children: [
          { index: true, element: <Navigate to="notifications" replace /> },
          { path: "notifications", element: <NotificationSettingsPage /> },
          { path: "expense-categories", element: <ExpenseCategoriesSettingsPage /> },
          { path: "child-cards", element: <ChildCardsSettingsPage /> },
          { path: "family", element: <FamilySettingsPage /> },
        ],
      },
      {
        path: "statistics",
        element: (
          <PrivateRoute>
            <StatisticsPage />
          </PrivateRoute>
        ),
      },
      {
        path: "day/:dateString",
        element: (
          <PrivateRoute>
            <DayDetailsPage />
          </PrivateRoute>
        ),
      },
      {
        path: "notes/:date",
        element: (
          <PrivateRoute>
            <NoteDetailsPage />
          </PrivateRoute>
        ),
        loader: noteDetailsLoader,
      },
      {
        path: "change-password",
        element: (
          <PrivateRoute>
            <ChangePasswordPage />
          </PrivateRoute>
        ),
      },
      {
        path: "profile", // Новый роут для страницы профиля
        element: (
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        ),
      },
    ],
  },
  // Маршрут для страницы 404
  // Он должен быть одним из последних в массиве верхнего уровня,
  // чтобы не перехватывать существующие маршруты.
  {
    path: "*",
    element: (
      <NavProvider>
        <RootLayout />
      </NavProvider>
    ),
    children: [
      {
        path: "*", // Вложенный path: "*" для корректной работы с Outlet в RootLayout
        element: <NotFoundPage />
      }
    ]
  }
];

const router = createBrowserRouter(routes);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
