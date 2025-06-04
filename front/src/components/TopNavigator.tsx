import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TopNavigator.css';

interface TopNavigatorProps {
  title: string;
  showButtons?: boolean;
}

const TopNavigator: React.FC<TopNavigatorProps> = ({ title, showButtons = true }) => {
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    navigate('/settings');
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
      {/* Иконка настроек справа */}
      <div className="flex items-center flex-shrink-0">
        {showButtons ? (
          <button onClick={handleSettingsClick} className="p-2 rounded-md hover:bg-gray-700 flex items-center">
            <span className="material-icons">settings</span>
          </button>
        ) : (
          // Placeholder для сохранения пространства, если кнопка скрыта
          <div className="p-2 invisible flex items-center w-10 h-10">
            <span className="material-icons">settings</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNavigator;