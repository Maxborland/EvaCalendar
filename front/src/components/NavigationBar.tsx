import clsx from 'clsx';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavigationBarProps {
  onCreateClick: () => void;
  isVisible?: boolean;
}

const getActiveSectionPath = (pathname: string) => {
  if (pathname === '/' || pathname.startsWith('/day/') || pathname.startsWith('/notes/')) {
    return '/';
  }
  if (pathname === '/money' || pathname === '/statistics') {
    return '/money';
  }
  if (pathname === '/children') {
    return '/children';
  }
  if (pathname === '/tasks') {
    return '/tasks';
  }
  return pathname;
};

const NavigationBar = ({
  onCreateClick,
  isVisible = true,
}: NavigationBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeSectionPath = getActiveSectionPath(location.pathname);

  const items = [
    { path: '/', label: 'План', icon: 'calendar_month' },
    { path: '/money', label: 'Деньги', icon: 'account_balance_wallet' },
    { path: '/children', label: 'Дети', icon: 'groups' },
    { path: '/tasks', label: 'Задачи', icon: 'task_alt' },
  ];

  return (
    <nav
      className={`fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-10 grid grid-cols-[1fr_1fr_64px_1fr_1fr] items-center w-[min(calc(100vw-24px),460px)] px-2 py-2 rounded-[24px] bg-surface-glass backdrop-blur-[14px] shadow-elevation-2 border border-border-subtle transition-[transform,opacity] duration-300 ease-out gap-1${
        isVisible
          ? ''
          : ' -translate-x-1/2 translate-y-[calc(100%+20px)] opacity-0 pointer-events-none'
      }`}
      aria-label="Главная навигация"
    >
      {items.slice(0, 2).map((item) => {
        const isActive = activeSectionPath === item.path;
        return (
          <button
            key={item.path}
            type="button"
            className={clsx(
              'min-h-12 rounded-2xl border-none bg-transparent px-1 text-[0.6875rem] font-semibold transition-all duration-[160ms] flex flex-col items-center justify-center gap-0.5 active:scale-95',
              isActive ? 'text-income-primary bg-income-bg' : 'text-text-tertiary hover:text-text-primary hover:bg-surface-elevated',
              '[&_.material-icons]:text-[21px]',
            )}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="material-icons" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
      <button
        type="button"
        className="inline-flex items-center justify-center size-14 rounded-full border-none bg-gradient-to-br from-btn-primary-bg to-[var(--theme-primary)] text-[var(--btn-primary-text-color)] shadow-elevation-1 transition-all duration-[180ms] cursor-pointer hover:-translate-y-0.5 hover:shadow-elevation-3 active:translate-y-0 active:scale-95 active:shadow-elevation-1 [&_.material-icons]:text-[30px]"
        onClick={onCreateClick}
        aria-label="Создать"
      >
        <span className="material-icons">add_circle</span>
      </button>
      {items.slice(2).map((item) => {
        const isActive = activeSectionPath === item.path;
        return (
          <button
            key={item.path}
            type="button"
            className={clsx(
              'min-h-12 rounded-2xl border-none bg-transparent px-1 text-[0.6875rem] font-semibold transition-all duration-[160ms] flex flex-col items-center justify-center gap-0.5 active:scale-95',
              isActive ? 'text-income-primary bg-income-bg' : 'text-text-tertiary hover:text-text-primary hover:bg-surface-elevated',
              '[&_.material-icons]:text-[21px]',
            )}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="material-icons" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default NavigationBar;
