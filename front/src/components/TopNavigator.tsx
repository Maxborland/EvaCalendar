import { faGear } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface TopNavigatorProps {
  isNavVisible: boolean;
}

const TopNavigator: React.FC<TopNavigatorProps> = ({ isNavVisible }) => {
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <nav className={`top-navigator ${isNavVisible ? 'visible' : 'hidden'}`}>
      <div className="logo">Zyaka Calendar</div>
      <button onClick={handleSettingsClick} className="settings-button">
        <FontAwesomeIcon icon={faGear} />
      </button>
    </nav>
  );
};

export default TopNavigator;