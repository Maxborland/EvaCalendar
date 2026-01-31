import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import TopNavigator from '../components/TopNavigator';

const SettingsPage = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="text-text-primary flex flex-col min-h-screen">
      <TopNavigator title="Настройки" showButtons={false} />

      <main className="flex-grow p-6">
        <nav className="border-b border-border-subtle mb-4">
          <ul className="flex gap-2 flex-wrap">
            <li className="flex-none">
              <NavLink
                to="/settings/notifications"
                className={({ isActive }) =>
                  `inline-flex items-center min-h-11 px-4 whitespace-nowrap rounded-t-md -mb-px border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus ${isActive ? 'bg-surface-raised text-text-primary border-border-subtle border-b-transparent' : 'bg-surface-glass text-text-secondary hover:bg-surface-elevated border-border-subtle/40'}`
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
                  `inline-flex items-center min-h-11 px-4 whitespace-nowrap rounded-t-md -mb-px border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus ${isActive ? 'bg-surface-raised text-text-primary border-border-subtle border-b-transparent' : 'bg-surface-glass text-text-secondary hover:bg-surface-elevated border-border-subtle/40'}`
                }
              >
                Категории
              </NavLink>
            </li>
            <li className="flex-none">
              <NavLink
                to="/settings/child-cards"
                className={({ isActive }) =>
                  `inline-flex items-center min-h-11 px-4 whitespace-nowrap rounded-t-md -mb-px border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus ${isActive ? 'bg-surface-raised text-text-primary border-border-subtle border-b-transparent' : 'bg-surface-glass text-text-secondary hover:bg-surface-elevated border-border-subtle/40'}`
                }
              >
                Дети
              </NavLink>
            </li>
            <li className="flex-none">
              <NavLink
                to="/settings/family"
                className={({ isActive }) =>
                  `inline-flex items-center min-h-11 px-4 whitespace-nowrap rounded-t-md -mb-px border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus ${isActive ? 'bg-surface-raised text-text-primary border-border-subtle border-b-transparent' : 'bg-surface-glass text-text-secondary hover:bg-surface-elevated border-border-subtle/40'}`
                }
              >
                Семья
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="max-w-2xl mx-auto mt-4">
          <Outlet />
        </div>
      </main>

    </div>
  );
};

export default SettingsPage;
