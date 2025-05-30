import { faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import type { ExpenseCategory } from '../services/api';
import {
  createExpenseCategory,
  deleteExpenseCategory,
  getExpenseCategories,
  getTasksByCategory,
  updateExpenseCategory,
  updateTask,
} from '../services/api';
import './ExpenseCategoryManager.css';

const ExpenseCategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getExpenseCategories();
      setCategories(data);
    } catch (error) {
      console.error('Ошибка при загрузке категорий расходов:', error);
      // Обработка ошибок, например, показ сообщения пользователю
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      await createExpenseCategory(newCategoryName);
      setNewCategoryName('');
      fetchCategories(); // Обновить список категорий
    } catch (error) {
      console.error('Ошибка при создании категории:', error);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.category_name.trim()) return;

    try {
      // Сохранить старую категорию
      const oldCategoryName = categories.find(cat => cat.id === editingCategory.id)?.category_name || '';

      // Обновить категорию
      await updateExpenseCategory(editingCategory.id, editingCategory.category_name);
      setEditingCategory(null); // Сбросить режим редактирования
      fetchCategories(); // Обновить список категорий

      // Обновить категории в задачах
      if (oldCategoryName && oldCategoryName !== editingCategory.category_name) {
        const tasks = await getTasksByCategory(oldCategoryName);
        for (const task of tasks.data) {
          await updateTask(task.id, { ...task, category: editingCategory.category_name });
        }
      }
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        const errorMessage = error.response.data.message;
        if (errorMessage === 'Category with this name already exists') {
          alert('Категория с таким именем уже существует. Пожалуйста, выберите другое имя.');
        } else {
          alert(`Ошибка: ${errorMessage}`);
        }
      } else {
        console.error('Ошибка при обновлении категории:', error);
      }
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту категорию?')) return;

    try {
      await deleteExpenseCategory(id);
      fetchCategories(); // Обновить список категорий
    } catch (error) {
      console.error('Ошибка при удалении категории:', error);
    }
  };

  return (
    <div className="expense-category-manager">
      <h2>Категории расходов</h2>

      <form onSubmit={handleCreateCategory} className="category-form">
        <input
          type="text"
          placeholder="Новая категория"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
        />
        <button type="submit">Добавить</button>
      </form>

      <ul className="category-list">
        {categories.map((category) => (
          <li key={category.id} className="category-item">
            {editingCategory?.id === category.id ? (
              <form onSubmit={handleUpdateCategory} className="edit-form">
                <input
                  type="text"
                  value={editingCategory.category_name}
                  onChange={(e) => {
                    setEditingCategory({ ...editingCategory, category_name: e.target.value });
                  }}
                />
                <button type="submit">Сохранить</button>
                <button type="button" onClick={() => setEditingCategory(null)}>
                  Отмена
                </button>
              </form>
            ) : (
              <>
                <span>{category.category_name}</span>
                <div className="actions">
                  <button onClick={() => setEditingCategory(category)} className="icon-button edit-button" title="Редактировать">
                    <FontAwesomeIcon icon={faPencil} />
                  </button>
                  <button onClick={() => handleDeleteCategory(category.id)} className="icon-button delete-button" title="Удалить">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ExpenseCategoryManager;