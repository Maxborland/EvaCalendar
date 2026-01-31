import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface TopNavigatorProps {
  title: string;
  showButtons?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
}

const TopNavigator = ({ title, showButtons = true, showBackButton = false, onBack }: TopNavigatorProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const isOnline = useOnlineStatus();

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const iconBtnClass =
    'inline-flex items-center justify-center size-11 rounded-xl border border-border-subtle bg-white/[0.04] text-text-primary cursor-pointer transition-all duration-[160ms] hover:bg-white/[0.08] hover:border-border-strong hover:-translate-y-px [&_.material-icons]:text-[22px]';

  return (
    <header className="sticky top-0 z-[1000] flex justify-between items-center py-[var(--spacing-md)] px-[var(--spacing-lg)] bg-surface-muted border-b border-border-subtle shadow-elevation-1 backdrop-blur-[12px] transition-transform duration-300 ease-out max-[360px]:py-[var(--spacing-sm)] max-[360px]:px-[var(--spacing-md)]">
      <div className="flex items-center gap-[var(--spacing-sm)] shrink-0">
        {showBackButton ? (
          <button
            type="button"
            className={iconBtnClass}
            onClick={handleBackClick}
            aria-label="Назад"
          >
            <span className="material-icons">arrow_back</span>
          </button>
        ) : (
          <a href="/" className="inline-flex items-center h-10">
            <img src="/icons/web/icon-512.png" alt="app icon" className="h-10 w-10 rounded-lg" />
          </a>
        )}
        {!isOnline && (
          <div
            className="inline-flex items-center gap-1 px-2 py-1 bg-[rgba(255,152,0,0.2)] border border-[rgba(255,152,0,0.4)] rounded-lg text-[#ff9800] text-xs font-medium [&_.material-icons]:text-[16px]"
            title="Нет подключения к интернету"
          >
            <span className="material-icons">cloud_off</span>
            <span className="hidden min-[480px]:inline">Оффлайн</span>
          </div>
        )}
      </div>
      <h1 className="flex-1 text-center text-lg font-semibold text-text-primary leading-tight m-0 px-[var(--spacing-sm)] overflow-hidden text-ellipsis whitespace-nowrap max-[360px]:text-base">
        {title}
      </h1>
      <div className="flex items-center gap-[var(--spacing-xs)] shrink-0">
        {showButtons ? (
          <>
            <button
              data-testid="settings-button"
              onClick={handleSettingsClick}
              className={iconBtnClass}
              aria-label="Настройки"
            >
              <span className="material-icons">settings</span>
            </button>
            {isAuthenticated && (
              <button
                data-testid="logout-button"
                onClick={handleLogout}
                className={iconBtnClass}
                aria-label="Выход"
              >
                <span className="material-icons">logout</span>
              </button>
            )}
          </>
        ) : (
          <div className="size-11" />
        )}
      </div>
    </header>
  );
};

export default TopNavigator;
