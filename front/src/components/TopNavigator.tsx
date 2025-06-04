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
    <header className="px-4 py-3 flex justify-between items-baseline text-white bg-gradient-to-b from-[#2C2C2C] to-transparent">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="flex items-center">
        {showButtons ? (
          <button onClick={handleSettingsClick} className="p-2 rounded-md hover:bg-gray-700 flex items-center">
            <span className="material-icons">settings</span>
          </button>
        ) : (
          <div className="p-2 invisible flex items-center">
            <span className="material-icons">settings</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNavigator;