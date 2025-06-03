import React from 'react';
import ExpenseCategoryManager from '../components/ExpenseCategoryManager'; // Импортируем компонент

const ExpenseCategoriesSettingsPage: React.FC = () => {
  return (
    <div>
      <h2>Настройки категорий расходов</h2>
      <ExpenseCategoryManager /> {/* Используем компонент */}
    </div>
  );
};

export default ExpenseCategoriesSettingsPage;