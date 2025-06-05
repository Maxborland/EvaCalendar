import { useEffect, useRef, useState } from 'react';
import { createBrowserRouter, Outlet, type RouteObject, RouterProvider, useNavigation } from 'react-router-dom';
import LoadingAnimation from './components/LoadingAnimation';
import PrivateRoute from './components/PrivateRoute';
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
import SettingsPage from './pages/SettingsPage';
import { getAllTasks, getDailySummary, getNoteByDate, getTasksForDay } from './services/api';

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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(214, 239, 199, 1)',
        zIndex: 9999,
      }}
      className={isLoading ? 'loader-visible' : 'loader-hidden'}
    >
      <LoadingAnimation speed={finalSpeed} />
    </div>
  );
};

const RootLayout: React.FC = () => {
  return (
    <NavProvider>
      <PageLoader />
      <div className="pt-20">
        <Outlet />
      </div>
    </NavProvider>
  );
};

const weekViewLoader = async () => {
  try {
    const tasks = await getAllTasks();
    return { tasks };
  } catch (error) {
    throw error;
  }
};

const dayDetailsLoader = async ({ params }: any) => {
  const dateString = params.dateString;
  if (!dateString) {
    throw new Response("Bad Request: dateString is required", { status: 400 });
  }
  try {
    const tasks = await getTasksForDay(dateString);
    const summary = await getDailySummary(dateString);
    return { tasks, summary, dateString };
  } catch (error) {
    throw new Response("Not Found or Error Loading Data", { status: 404 });
  }
};

const noteDetailsLoader = async ({ params }: any) => {
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
        index: true,
        element: (
          <PrivateRoute>
            <WeekView />
          </PrivateRoute>
        ),
        loader: weekViewLoader,
      },
      {
        path: "dashboard",
        element: (
          <PrivateRoute>
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
        loader: dayDetailsLoader,
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
    ],
  },
];

const router = createBrowserRouter(routes);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
