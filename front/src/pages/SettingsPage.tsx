import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ChildCardManager from '../components/ChildCardManager';
import ExpenseCategoryManager from '../components/ExpenseCategoryManager';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-md mx-auto settings-page-container">
        <button onClick={handleGoBack} className="back-button">
          <FontAwesomeIcon icon={faArrowLeft} /> Назад
        </button>
        <h1>Настройки</h1>
        <div className="component-padding-x">
          <ExpenseCategoryManager />
        </div>
        <div className="component-padding-x">
          <ChildCardManager />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;