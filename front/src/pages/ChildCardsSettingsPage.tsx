import React from 'react';
import ChildCardManager from '../components/ChildCardManager'; // Исправлен путь импорта

const ChildCardsSettingsPage: React.FC = () => {
  return (
    <div>
      <h2>Настройки карточек детей</h2>
      <ChildCardManager /> {/* Компонент интегрирован */}
    </div>
  );
};

export default ChildCardsSettingsPage;