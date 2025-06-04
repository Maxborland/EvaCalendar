import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="bg-slate-900 text-white flex flex-col min-h-screen">
      <header className="bg-slate-800 shadow-md">
        <div className="container mx-auto px-4 flex justify-start h-16">
          <h2 className="text-xl font-semibold flex items-center h-full">Настройки</h2>
        </div>
      </header>

      <main className="flex-grow p-6 pb-24">
        <nav className="space-y-4">
          <Link
            to="/settings/expense-categories"
            className="block bg-slate-800 hover:bg-slate-700 p-4 rounded-lg shadow transition-colors duration-200"
          >
            <h2 className="text-lg font-medium">Категории расходов</h2>
            <p className="text-sm text-slate-400">
              Управление категориями расходов для отслеживания финансов.
            </p>
          </Link>
          <Link
            to="/settings/child-cards"
            className="block bg-slate-800 hover:bg-slate-700 p-4 rounded-lg shadow transition-colors duration-200"
          >
            <h2 className="text-lg font-medium">Детские карточки</h2>
            <p className="text-sm text-slate-400">
              Настройка и управление карточками детей.
            </p>
          </Link>
          {/* Другие ссылки на настройки могут быть добавлены здесь */}
        </nav>
        <div className="mt-8">
          <Outlet />
        </div>
      </main>

      <footer className="p-4 fixed bottom-0 left-0 right-0 bg-transparent flex justify-start items-center">
        <button
          onClick={handleGoBack}
          className="flex items-center text-sm text-slate-300 hover:text-white transition-colors w-1/2 justify-center py-3 bg-slate-800 hover:bg-slate-700 rounded-lg"
          aria-label="Go back"
        >
          <span className="material-icons mr-2 text-lg">arrow_back</span>
          Назад
        </button>
        <p className="mt-4 text-center text-xs text-slate-500"></p>
      </footer>
    </div>
  );
};

export default SettingsPage;