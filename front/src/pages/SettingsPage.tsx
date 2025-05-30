import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ExpenseCategoryManager from '../components/ExpenseCategoryManager';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // Возвращаемся на предыдущую страницу
  };

  return (
    <div>
      <button onClick={handleGoBack} className="back-button">
        <FontAwesomeIcon icon={faArrowLeft} /> Назад
      </button>
      <h1>Настройки</h1>
      <p>Здесь будут располагаться настройки приложения.</p>
      <ExpenseCategoryManager />
    </div>
  );
};

export default SettingsPage;