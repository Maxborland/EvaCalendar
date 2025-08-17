import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import TopNavigator from '../components/TopNavigator';

const SettingsPage = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="text-white flex flex-col min-h-screen">
      <TopNavigator title="Настройки" showButtons={false} />

      <main className="flex-grow p-6">
        <nav className="border-b border-slate-600 mb-4">
          <ul className="flex gap-2 flex-wrap">
            <li className="flex-none">
              <NavLink
                to="/settings/notifications"
                className={({ isActive }) =>
                  `inline-flex items-center h-10 px-4 whitespace-nowrap rounded-t-md -mb-px border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 ${isActive ? 'bg-slate-800 text-white border-slate-600 border-b-transparent' : 'bg-slate-700/70 text-slate-200 hover:bg-slate-600 border-slate-600/40'}`
                }
                end
              >
                Уведомления
              </NavLink>
            </li>
            <li className="flex-none">
              <NavLink
                to="/settings/expense-categories"
                className={({ isActive }) =>
                  `inline-flex items-center h-10 px-4 whitespace-nowrap rounded-t-md -mb-px border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 ${isActive ? 'bg-slate-800 text-white border-slate-600 border-b-transparent' : 'bg-slate-700/70 text-slate-200 hover:bg-slate-600 border-slate-600/40'}`
                }
              >
                Категории
              </NavLink>
            </li>
            <li className="flex-none">
              <NavLink
                to="/settings/child-cards"
                className={({ isActive }) =>
                  `inline-flex items-center h-10 px-4 whitespace-nowrap rounded-t-md -mb-px border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 ${isActive ? 'bg-slate-800 text-white border-slate-600 border-b-transparent' : 'bg-slate-700/70 text-slate-200 hover:bg-slate-600 border-slate-600/40'}`
                }
              >
                Дети
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="mt-4">
          <Outlet />
        </div>
      </main>

    </div>
  );
};

export default SettingsPage;