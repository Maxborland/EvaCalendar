import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import './TopNavigator.css';

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

  return (
    <header className="top-navigator">
      <div className="top-navigator__left">
        {showBackButton ? (
          <button
            type="button"
            className="top-navigator__back"
            onClick={handleBackClick}
            aria-label="Назад"
          >
            <span className="material-icons">arrow_back</span>
          </button>
        ) : (
          <a href="/" className="top-navigator__logo">
            <img src="/icons/web/icon-512.png" alt="app icon" />
          </a>
        )}
        {!isOnline && (
          <div className="top-navigator__offline-badge" title="Нет подключения к интернету">
            <span className="material-icons">cloud_off</span>
            <span className="top-navigator__offline-text">Оффлайн</span>
          </div>
        )}
      </div>
      <h1 className="top-navigator__title">{title}</h1>
      <div className="top-navigator__actions">
        {showButtons ? (
          <>
            <button
              data-testid="settings-button"
              onClick={handleSettingsClick}
              className="top-navigator__btn"
              aria-label="Настройки"
            >
              <span className="material-icons">settings</span>
            </button>
            {isAuthenticated && (
              <button
                data-testid="logout-button"
                onClick={handleLogout}
                className="top-navigator__btn"
                aria-label="Выход"
              >
                <span className="material-icons">logout</span>
              </button>
            )}
          </>
        ) : (
          <div className="top-navigator__spacer" />
        )}
      </div>
    </header>
  );
};

export default TopNavigator;