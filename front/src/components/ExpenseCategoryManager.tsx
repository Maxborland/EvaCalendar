import { faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faFloppyDisk } from '@fortawesome/free-solid-svg-icons/faFloppyDisk';
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
      console.error('Ошибка при загрузке категорий расходов:', error);
      // Обработка ошибок, например, показ сообщения пользователю
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    // SP-2: Проверка на существующее имя категории (без учета регистра)
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
      fetchCategories(); // Обновить список категорий
    } catch (error) {
      console.error('Ошибка при создании категории:', error);
      // SP-2: Дополнительная обработка ошибки с сервера, если она все же возникнет
      if ((error as any)?.response?.data?.message === 'Category with this name already exists') {
        alert('Категория с таким названием уже существует (проверка на сервере).');
      }
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.categoryName.trim()) return;

    // SP-2: Проверка на существующее имя категории (без учета регистра), исключая текущую редактируемую категорию
    const existingCategory = categories.find(
      (cat) =>
        cat.uuid !== editingCategory.uuid && // Changed from id to uuid
        cat.categoryName.toLowerCase() === editingCategory.categoryName.trim().toLowerCase()
    );
    if (existingCategory) {
      alert('Категория с таким названием уже существует. Пожалуйста, выберите другое имя.');
      return;
    }

    try {
      // Сохранить старую категорию
      // const oldCategoryName = categories.find(cat => cat.uuid === editingCategory.uuid)?.categoryName || ''; // Changed from id to uuid

      // Обновить категорию
      await updateExpenseCategory(editingCategory.uuid, editingCategory.categoryName); // Changed from id to uuid
      setEditingCategory(null); // Сбросить режим редактирования
      fetchCategories(); // Обновить список категорий

      // Обновление категорий в задачах теперь не требуется здесь,
      // так как UUID категории не меняется, и expenceTypeId в задачах остается корректным.
      // Отображение актуального имени категории в задачах должно происходить
      // за счет обновления списка категорий (через fetchCategories()) и последующего
      // корректного маппинга expenceTypeId на имя категории в компонентах, отображающих задачи.
      // if (oldCategoryName && oldCategoryName !== updatedCategory.categoryName) {
      //   console.log(`Category name changed from "${oldCategoryName}" to "${updatedCategory.categoryName}". Associated tasks' display should update.`);
      // }
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

  const handleDeleteCategory = async (uuid: string) => { // Changed parameter name from id to uuid
    // SP-1: Проверка, связана ли категория с расходами
    try {
      const categoryToDelete = categories.find(cat => cat.uuid === uuid); // Changed from id to uuid
      if (!categoryToDelete) {
        console.error('Категория для удаления не найдена');
        return;
      }
      const tasksResponse = await getTasksByCategory(categoryToDelete.uuid); // Используем UUID для проверки связанных задач
      if (tasksResponse.data && tasksResponse.data.length > 0) {
        alert('Невозможно удалить категорию, так как с ней связаны расходы. Сначала измените или удалите эти расходы.');
        return;
      }
    } catch (error) {
      console.error('Ошибка при проверке связанных задач:', error);
      alert('Произошла ошибка при проверке связанных задач. Попробуйте еще раз.');
      return;
    }

    if (!window.confirm('Вы уверены, что хотите удалить эту категорию? Это действие необратимо.')) return;

    try {
      await deleteExpenseCategory(uuid); // Changed from id to uuid
      fetchCategories(); // Обновить список категорий
    } catch (error) {
      console.error('Ошибка при удалении категории:', error);
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
          <li key={category.uuid || `category-${index}`} className="category-item"> {/* Changed from id to uuid, kept fallback */}
            {editingCategory?.uuid === category.uuid ? ( // Changed from id to uuid
              <form onSubmit={handleUpdateCategory} className="edit-form">
                <input
                  type="text"
                  style={{ color: "black" }}
                  value={editingCategory?.categoryName || ''}
                  onChange={(e) => {
                    if (editingCategory) { // Добавлена проверка на null перед доступом к свойствам
                      setEditingCategory({ ...editingCategory, categoryName: e.target.value });
                    } else {
                      // Эта ветка не должна достигаться, если editingCategory?.category_name используется для value
                      // console.error('[ExpenseCategoryManager] onChange input - editingCategory is null, cannot set new value'); // Оставим закомментированным на всякий случай
                    }
                  }}
                />
                <button type="submit" className="btn btn-icon">{<FontAwesomeIcon icon={faFloppyDisk} />}</button>
                <button type="button" className="btn btn-icon" onClick={() => {
                  setEditingCategory(null);
                }}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </form>
            ) : (
              <>
                <span>{category.categoryName}</span>
                <div className="actions">
                  <button onClick={() => setEditingCategory(category)} className="btn btn-icon icon-button edit-button" title="Редактировать">
                    <FontAwesomeIcon icon={faPencil} />
                  </button>
                  <button onClick={() => handleDeleteCategory(category.uuid)} className="btn btn-icon icon-button delete-button" title="Удалить"> {/* Changed from id to uuid */}
                    <FontAwesomeIcon icon={faTrash} />
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