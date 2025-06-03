import React from 'react';
import { useNavigate } from 'react-router-dom';

// Удаляем isNavVisible из пропсов, так как хэдер всегда виден
interface TopNavigatorProps {}

const TopNavigator: React.FC<TopNavigatorProps> = () => {
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <header className="bg-header p-4 flex justify-between items-center">
      <h2 className="text-xl font-semibold">Zyaka's Calendar</h2>
      <button onClick={handleSettingsClick} className="p-2 rounded-md hover:bg-gray-700 flex items-center">
        <span className="material-icons">settings</span>
      </button>
    </header>
  );
};

export default TopNavigator;