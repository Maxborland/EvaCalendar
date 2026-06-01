import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { createBrowserRouter, Outlet, type RouteObject, RouterProvider, useNavigation, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingAnimation from './components/LoadingAnimation';
import PrivateRoute from './components/PrivateRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute'; // Импорт PublicOnlyRoute
import { NavProvider } from './context/NavContext';
import { getNoteByDate } from './services/api';

const WeekView = lazy(() => import('./components/WeekView'));
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const RegistrationPage = lazy(() => import('./pages/Auth/RegistrationPage'));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'));
const ChildCardsSettingsPage = lazy(() => import('./pages/ChildCardsSettingsPage'));
const ChildrenPage = lazy(() => import('./pages/ChildrenPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DayDetailsPage = lazy(() => import('./pages/DayDetailsPage'));
const ExpenseCategoriesSettingsPage = lazy(() => import('./pages/ExpenseCategoriesSettingsPage'));
const NoteDetailsPage = lazy(() => import('./pages/NoteDetailsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const MoneyPage = lazy(() => import('./pages/MoneyPage'));
const StatisticsPage = lazy(() => import('./pages/StatisticsPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const FamilySettingsPage = lazy(() => import('./pages/FamilySettingsPage'));
const NotificationSettingsPage = lazy(() => import('./pages/NotificationSettingsPage'));

const routeSuspense = (children: ReactNode) => (
  <Suspense fallback={<LoadingAnimation />}>
    {children}
  </Suspense>
);

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
  } catch {
    throw new Response("Not Found or Error Loading Note Data", { status: 404 });
  }
};

const routes: RouteObject[] = [
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: "/login",
        element: routeSuspense(<LoginPage />),
      },
      {
        path: "/register",
        element: routeSuspense(<RegistrationPage />),
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
            {routeSuspense(<WeekView />)}
          </PrivateRoute>
        ),
      },
      {
        path: "dashboard",
        element: (
          <PrivateRoute allowedRoles={['admin']}>
            {routeSuspense(<DashboardPage />)}
          </PrivateRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <PrivateRoute>
            {routeSuspense(<SettingsPage />)}
          </PrivateRoute>
        ),
        children: [
          { index: true, element: <Navigate to="notifications" replace /> },
          { path: "notifications", element: routeSuspense(<NotificationSettingsPage />) },
          { path: "expense-categories", element: routeSuspense(<ExpenseCategoriesSettingsPage />) },
          { path: "child-cards", element: routeSuspense(<ChildCardsSettingsPage />) },
          { path: "family", element: routeSuspense(<FamilySettingsPage />) },
        ],
      },
      {
        path: "statistics",
        element: (
          <PrivateRoute>
            {routeSuspense(<StatisticsPage />)}
          </PrivateRoute>
        ),
      },
      {
        path: "money",
        element: (
          <PrivateRoute>
            {routeSuspense(<MoneyPage />)}
          </PrivateRoute>
        ),
      },
      {
        path: "children",
        element: (
          <PrivateRoute>
            {routeSuspense(<ChildrenPage />)}
          </PrivateRoute>
        ),
      },
      {
        path: "tasks",
        element: (
          <PrivateRoute>
            {routeSuspense(<TasksPage />)}
          </PrivateRoute>
        ),
      },
      {
        path: "day/:dateString",
        element: (
          <PrivateRoute>
            {routeSuspense(<DayDetailsPage />)}
          </PrivateRoute>
        ),
      },
      {
        path: "notes/:date",
        element: (
          <PrivateRoute>
            {routeSuspense(<NoteDetailsPage />)}
          </PrivateRoute>
        ),
        loader: noteDetailsLoader,
      },
      {
        path: "change-password",
        element: (
          <PrivateRoute>
            {routeSuspense(<ChangePasswordPage />)}
          </PrivateRoute>
        ),
      },
      {
        path: "profile", // Новый роут для страницы профиля
        element: (
          <PrivateRoute>
            {routeSuspense(<ProfilePage />)}
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
        element: routeSuspense(<NotFoundPage />)
      }
    ]
  }
];

const router = createBrowserRouter(routes);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
