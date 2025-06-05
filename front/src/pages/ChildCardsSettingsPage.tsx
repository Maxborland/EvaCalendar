import React from 'react';
import ChildCardManager from '../components/ChildCardManager';

const ChildCardsSettingsPage: React.FC = () => {
  return (
    <div>
      <h2>Настройки карточек детей</h2>
      <ChildCardManager />
    </div>
  );
};

export default ChildCardsSettingsPage;