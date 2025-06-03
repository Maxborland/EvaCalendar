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
    <header className="p-4 flex justify-between items-baseline text-white shadow-md bg-gradient-to-b from-[#4a5568] to-transparent">
      <h2 className="text-xl font-semibold">Zyaka's Calendar</h2>
      <button onClick={handleSettingsClick} className="p-2 rounded-md hover:bg-gray-700 flex items-center"> {/* p-2 added back here */}
        <span className="material-icons">settings</span> {/* p-2 removed from here */}
      </button>
    </header>
  );
};

export default TopNavigator;