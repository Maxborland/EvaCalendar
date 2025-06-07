import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Добавлено
import './TopNavigator.css';

interface TopNavigatorProps {
  title: string;
  showButtons?: boolean;
}

const TopNavigator = ({ title, showButtons = true }: TopNavigatorProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleLogout = async () => {
    await logout();
    // Навигация на /login больше не нужна, так как
    // PrivateRoute автоматически обработает изменение состояния
    // и выполнит редирект.
    // navigate('/login');
  };

  return (
    <header className="top-navigator px-4 py-3 flex items-center justify-between text-white bg-gradient-to-b from-[#2C2C2C] to-transparent">
      <div className="flex items-center flex-shrink-0">
        <a href="/"><img src="/icons/web/icon-512.png" alt="app icon" className="h-10 mr-2" /></a>
      </div>
      <h2 className="text-xl font-semibold leading-6 text-center flex-grow mb-0">
        {title}
      </h2>
      <div className="flex items-center flex-shrink-0 space-x-2">
        {showButtons && (
          <button data-testid="settings-button" onClick={handleSettingsClick} className="p-2 rounded-md hover:bg-gray-700 flex items-center">
            <span className="material-icons">settings</span>
          </button>
        )}
        {isAuthenticated && showButtons && (
          <button data-testid="logout-button" onClick={handleLogout} className="p-2 rounded-md hover:bg-gray-700 flex items-center">
            <span className="material-icons">logout</span>
          </button>
        )}
        {!showButtons && (
            <>
              <div className="p-2 invisible flex items-center w-10 h-10">
                <span className="material-icons">settings</span>
              </div>
              {isAuthenticated && (
                <div className="p-2 invisible flex items-center w-10 h-10">
                  <span className="material-icons">logout</span>
                </div>
              )}
            </>
        )}
      </div>
    </header>
  );
};

export default TopNavigator;