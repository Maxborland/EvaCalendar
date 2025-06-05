import React from 'react';
import ExpenseCategoryManager from '../components/ExpenseCategoryManager';

const ExpenseCategoriesSettingsPage: React.FC = () => {
  return (
    <div>
      <h2>Настройки категорий расходов</h2>
      <ExpenseCategoryManager />
    </div>
  );
};

export default ExpenseCategoriesSettingsPage;