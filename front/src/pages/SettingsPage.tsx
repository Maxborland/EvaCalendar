import { Link, Outlet, useNavigate } from 'react-router-dom';
import NotificationSettings from '../components/NotificationSettings';
import TopNavigator from '../components/TopNavigator';

const SettingsPage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="text-white flex flex-col min-h-screen">
      <TopNavigator title="Настройки" showButtons={false} />

      <main className="flex-grow p-6 pb-24">
        <nav className="space-y-4">
          <Link to="/settings/expense-categories" className="block bg-slate-800 hover:bg-slate-700 p-4 rounded-lg">
            <h2 className="text-lg font-medium">Категории расходов</h2>
            <p className="text-sm text-slate-400">Управление категориями расходов.</p>
          </Link>
          <Link to="/settings/child-cards" className="block bg-slate-800 hover:bg-slate-700 p-4 rounded-lg">
            <h2 className="text-lg font-medium">Детские карточки</h2>
            <p className="text-sm text-slate-400">Настройка карточек детей.</p>
          </Link>
        </nav>

        <div className="mt-8 bg-slate-800 p-6 rounded-lg shadow">
          <NotificationSettings />
        </div>

        <div className="mt-8">
          <Outlet />
        </div>
      </main>

      <footer className="p-4 fixed bottom-0 left-0 right-0 bg-transparent flex justify-start items-center">
        <button onClick={handleGoBack} className="flex items-center text-sm text-slate-300 hover:text-white w-1/2 justify-center py-3 bg-slate-800 hover:bg-slate-700 rounded-lg">
          <span className="material-icons mr-2 text-lg">arrow_back</span>
          Назад
        </button>
      </footer>
    </div>
  );
};

export default SettingsPage;