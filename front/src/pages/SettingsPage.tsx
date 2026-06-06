import { useEffect, useState } from 'react';
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

type ThemeMode = 'light' | 'dark' | 'system';

const themeOptions: Array<{ value: ThemeMode; label: string; icon: string }> = [
  { value: 'light', label: 'Светлая', icon: 'light_mode' },
  { value: 'dark', label: 'Темная', icon: 'dark_mode' },
  { value: 'system', label: 'Система', icon: 'contrast' },
];

const SettingsPage = () => {
  const location = useLocation();
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const savedTheme = window.localStorage.getItem('eva-theme-mode');
    return savedTheme === 'dark' || savedTheme === 'system' || savedTheme === 'light'
      ? savedTheme
      : 'light';
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleThemeChange = (mode: ThemeMode) => {
    window.localStorage.setItem('eva-theme-mode', mode);
    document.documentElement.dataset.theme = mode;
    setThemeMode(mode);
  };

  return (
    <div className="min-h-dvh flex flex-col bg-surface-app text-text-primary">
      <TopNavigator title="Настройки" showButtons={false} showBackButton={true} backTo="/" />

      <main className="eva-screen eva-screen--plain flex-1 p-4 pb-[calc(24px+env(safe-area-inset-bottom))] max-[360px]:p-3">
        <section className="mb-4 rounded-2xl border border-border-subtle bg-surface-raised p-2 shadow-glass" aria-label="Тема интерфейса">
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((option) => {
              const isActive = themeMode === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`min-h-14 rounded-xl border px-2 py-2 text-xs font-semibold transition-all duration-[160ms] inline-flex flex-col items-center justify-center gap-1 active:scale-[0.98] ${
                    isActive
                      ? 'border-income-border bg-income-bg text-income-primary'
                      : 'border-border-subtle bg-surface-elevated text-text-secondary hover:text-text-primary'
                  }`}
                  onClick={() => handleThemeChange(option.value)}
                  aria-pressed={isActive}
                >
                  <span className="material-icons text-[20px]" aria-hidden="true">{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <nav className="settings-section-grid" aria-label="Разделы настроек">
          <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0">
            {settingsItems.map((item) => (
              <li key={item.to} className="min-w-0">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `settings-section-link ${
                      isActive
                        ? 'settings-section-link--active'
                        : ''
                    }`
                  }
                  end={item.to === '/settings/notifications'}
                >
                  <span className="material-icons settings-section-link__icon" aria-hidden="true">{item.icon}</span>
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
