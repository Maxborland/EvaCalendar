import React from 'react';
import ExpenseCategoryManager from '../components/ExpenseCategoryManager'; // Импортируем компонент

const ExpenseCategoriesSettingsPage: React.FC = () => {
  return (
    <div>
      <h1>Настройки категорий расходов</h1>
      <ExpenseCategoryManager /> {/* Используем компонент */}
    </div>
  );
};

export default ExpenseCategoriesSettingsPage;