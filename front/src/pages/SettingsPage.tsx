import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import TopNavigator from '../components/TopNavigator';

const settingsItems = [
  {
    to: '/settings/notifications',
    label: 'Уведомления',
    icon: 'notifications',
  },
  {
    to: '/settings/expense-categories',
    label: 'Категории',
    icon: 'category',
  },
  {
    to: '/settings/child-cards',
    label: 'Дети',
    icon: 'groups',
  },
  {
    to: '/settings/family',
    label: 'Семья',
    icon: 'supervisor_account',
  },
];

const SettingsPage = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-dvh flex flex-col bg-surface-app text-text-primary">
      <TopNavigator title="Настройки" showButtons={false} showBackButton={true} />

      <main className="flex-1 p-4 pb-[calc(24px+env(safe-area-inset-bottom))] max-[360px]:p-3">
        <nav className="rounded-2xl border border-border-subtle bg-surface-raised p-2 shadow-glass" aria-label="Разделы настроек">
          <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0">
            {settingsItems.map((item) => (
              <li key={item.to} className="min-w-0">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `min-h-14 rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-[160ms] inline-flex items-center gap-2 active:scale-[0.98] ${
                      isActive
                        ? 'border-income-border bg-income-bg text-income-primary'
                        : 'border-border-subtle bg-surface-elevated text-text-secondary hover:text-text-primary'
                    }`
                  }
                  end={item.to === '/settings/notifications'}
                >
                  <span className="material-icons shrink-0 text-[20px]" aria-hidden="true">{item.icon}</span>
                  <span className="min-w-0 truncate">{item.label}</span>
                </NavLink>
              </li>
            ))}
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
