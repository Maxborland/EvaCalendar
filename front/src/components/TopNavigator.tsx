import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Добавлено
import api from '../services/api'; // Добавлено
import './TopNavigator.css';

interface TopNavigatorProps {
  title: string;
  showButtons?: boolean;
}

const TopNavigator: React.FC<TopNavigatorProps> = ({ title, showButtons = true }) => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, token } = useAuth(); // Добавлено

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleLogout = async () => { // Добавлено
    if (token) {
      try {
        await api.post('/api/auth/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // Логирование успешного выхода с сервера можно добавить здесь
        console.log('Successfully logged out from server');
      } catch (error) {
        // Логирование ошибки выхода с сервера можно добавить здесь
        console.error('Failed to logout from server:', error);
      }
    }
    logout(); // Очистка состояния на клиенте
    navigate('/login'); // Перенаправление на страницу входа
  };

  return (
    <header className="top-navigator px-4 py-3 flex items-center justify-between text-white bg-gradient-to-b from-[#2C2C2C] to-transparent">
      {/* Логотип слева */}
      <div className="flex items-center flex-shrink-0">
        <img src="/icons/web/icon-512.png" alt="app icon" className="h-10 mr-2" />
      </div>
      {/* Заголовок по центру */}
      <h2 className="text-xl font-semibold leading-6 text-center flex-grow mb-0">
        {title}
      </h2>
      {/* Иконки справа */}
      <div className="flex items-center flex-shrink-0 space-x-2"> {/* Добавлен space-x-2 для отступов между кнопками */}
        {showButtons && (
          <button onClick={handleSettingsClick} className="p-2 rounded-md hover:bg-gray-700 flex items-center">
            <span className="material-icons">settings</span>
          </button>
        )}
        {isAuthenticated && showButtons && ( // Кнопка Выход отображается, если пользователь аутентифицирован и showButtons true
          <button onClick={handleLogout} className="p-2 rounded-md hover:bg-gray-700 flex items-center">
            <span className="material-icons">logout</span>
          </button>
        )}
        {!showButtons && (
            // Placeholder для сохранения пространства, если кнопки скрыты
            // Если есть кнопка выхода, то нужно два плейсхолдера
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