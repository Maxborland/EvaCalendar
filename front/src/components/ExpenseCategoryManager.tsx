import React, { useEffect, useState } from 'react';
import type { ExpenseCategory } from '../services/api';
import {
  createExpenseCategory,
  deleteExpenseCategory,
  getExpenseCategories,
  getTasksByCategory,
  updateExpenseCategory
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
      // Ошибка при загрузке категорий расходов
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const existingCategory = categories.find(
      (cat) => cat.categoryName.toLowerCase() === newCategoryName.trim().toLowerCase()
    );
    if (existingCategory) {
      alert('Категория с таким названием уже существует.');
      return;
    }

    try {
      await createExpenseCategory(newCategoryName);
      setNewCategoryName('');
      fetchCategories();
    } catch (error) {
      // Ошибка при создании категории
      if ((error as any)?.response?.data?.message === 'Category with this name already exists') {
        alert('Категория с таким названием уже существует (проверка на сервере).');
      }
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.categoryName.trim()) return;

    const existingCategory = categories.find(
      (cat) =>
        cat.uuid !== editingCategory.uuid &&
        cat.categoryName.toLowerCase() === editingCategory.categoryName.trim().toLowerCase()
    );
    if (existingCategory) {
      alert('Категория с таким названием уже существует. Пожалуйста, выберите другое имя.');
      return;
    }

    try {
      await updateExpenseCategory(editingCategory.uuid, editingCategory.categoryName);
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        const errorMessage = error.response.data.message;
        if (errorMessage === 'Category with this name already exists') {
          alert('Категория с таким именем уже существует. Пожалуйста, выберите другое имя.');
        } else {
          alert(`Ошибка: ${errorMessage}`);
        }
      } else {
        // Ошибка при обновлении категории
      }
    }
  };

  const handleDeleteCategory = async (uuid: string) => {
    try {
      const categoryToDelete = categories.find(cat => cat.uuid === uuid);
      if (!categoryToDelete) {
        // Категория для удаления не найдена
        return;
      }
      const tasksResponse = await getTasksByCategory(categoryToDelete.uuid);
      if (tasksResponse.data && tasksResponse.data.length > 0) {
        alert('Невозможно удалить категорию, так как с ней связаны расходы. Сначала измените или удалите эти расходы.');
        return;
      }
    } catch (error) {
      // Ошибка при проверке связанных задач
      alert('Произошла ошибка при проверке связанных задач. Попробуйте еще раз.');
      return;
    }

    if (!window.confirm('Вы уверены, что хотите удалить эту категорию? Это действие необратимо.')) return;

    try {
      await deleteExpenseCategory(uuid);
      fetchCategories();
    } catch (error) {
      // Ошибка при удалении категории
      alert('Ошибка при удалении категории. Пожалуйста, попробуйте еще раз.');
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
        <button type="submit" className="btn btn-primary">Добавить</button>
      </form>

      <ul className="category-list">
        {categories.map((category, index) => {
          return (
          <li key={category.uuid || `category-${index}`} className="category-item">
            {editingCategory?.uuid === category.uuid ? (
              <form onSubmit={handleUpdateCategory} className="edit-form">
                <input
                  type="text"
                  style={{ color: "black" }}
                  value={editingCategory?.categoryName || ''}
                  onChange={(e) => {
                    if (editingCategory) {
                      setEditingCategory({ ...editingCategory, categoryName: e.target.value });
                    } else {
                    }
                  }}
                />
                <button type="submit" className="btn btn-icon"><span className="material-icons">save</span></button>
                <button type="button" className="btn btn-icon" onClick={() => {
                  setEditingCategory(null);
                }}>
                  <span className="material-icons">close</span>
                </button>
              </form>
            ) : (
              <>
                <span>{category.categoryName}</span>
                <div className="actions">
                  <button onClick={() => setEditingCategory(category)} className="btn btn-icon icon-button edit-button" title="Редактировать">
                    <span className="material-icons">edit</span>
                  </button>
                  <button onClick={() => handleDeleteCategory(category.uuid)} className="btn btn-icon icon-button delete-button" title="Удалить">
                    <span className="material-icons">delete</span>
                  </button>
                </div>
              </>
            )}
          </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ExpenseCategoryManager;