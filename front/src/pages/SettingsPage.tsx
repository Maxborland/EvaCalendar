import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import SettingsMenu from '../components/SettingsMenu';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/'); // Перенаправляем на главную страницу
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-md mx-auto settings-page-container">
        <button onClick={handleGoBack} className="btn btn-secondary">
          <FontAwesomeIcon icon={faArrowLeft} /> Назад
        </button>
        <h1>Настройки</h1>
        <SettingsMenu />
        <div className="component-padding-x">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;