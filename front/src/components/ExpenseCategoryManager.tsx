import { useState, type FormEvent } from 'react';
import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
  useDeleteExpenseCategory
} from '../hooks/useExpenseCategories';
import type { ExpenseCategory } from '../services/api';
import { getTasksByCategory } from '../services/api';
import './ExpenseCategoryManager.css';

const ExpenseCategoryManager = () => {
  const { data: categories = [], isLoading } = useExpenseCategories();
  const createCategoryMutation = useCreateExpenseCategory();
  const updateCategoryMutation = useUpdateExpenseCategory();
  const deleteCategoryMutation = useDeleteExpenseCategory();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);

  const handleCreateCategory = async (e: FormEvent) => {
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
      await createCategoryMutation.mutateAsync(newCategoryName);
      setNewCategoryName('');
    } catch (error) {
      if ((error as any)?.response?.data?.message === 'Category with this name already exists') {
        alert('Категория с таким названием уже существует (проверка на сервере).');
      }
    }
  };

  const handleUpdateCategory = async (e: FormEvent) => {
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
      await updateCategoryMutation.mutateAsync({
        uuid: editingCategory.uuid,
        categoryName: editingCategory.categoryName
      });
      setEditingCategory(null);
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        const errorMessage = error.response.data.message;
        if (errorMessage === 'Category with this name already exists') {
          alert('Категория с таким именем уже существует. Пожалуйста, выберите другое имя.');
        } else {
          alert(`Ошибка: ${errorMessage}`);
        }
      }
    }
  };

  const handleDeleteCategory = async (uuid: string) => {
    try {
      const categoryToDelete = categories.find(cat => cat.uuid === uuid);
      if (!categoryToDelete) {
        return;
      }
      const tasksResponse = await getTasksByCategory(categoryToDelete.uuid);
      if (tasksResponse.data && tasksResponse.data.length > 0) {
        alert('Невозможно удалить категорию, так как с ней связаны расходы. Сначала измените или удалите эти расходы.');
        return;
      }
    } catch (error) {
      alert('Произошла ошибка при проверке связанных задач. Попробуйте еще раз.');
      return;
    }

    if (!window.confirm('Вы уверены, что хотите удалить эту категорию? Это действие необратимо.')) return;

    try {
      await deleteCategoryMutation.mutateAsync(uuid);
    } catch (error) {
      alert('Ошибка при удалении категории. Пожалуйста, попробуйте еще раз.');
    }
  };

  return (
    <div className="expense-category-manager">
      <h2>Категории расходов</h2>

      <form onSubmit={handleCreateCategory} className="category-form">
        <input className='text-white'
          type="text"
          placeholder="Новая категория"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Добавить</button>
      </form>

      <ul className="category-list">
        {isLoading && <p>Загрузка...</p>}
        {!isLoading && categories.map((category, index) => {
          return (
          <li key={category.uuid || `category-${index}`} className="category-item">
            {editingCategory?.uuid === category.uuid ? (
              <form onSubmit={handleUpdateCategory} className="edit-form">
                <input
                  type="text"
                  value={editingCategory?.categoryName || ''}
                  onChange={(e) => {
                    if (editingCategory) {
                      setEditingCategory({ ...editingCategory, categoryName: e.target.value });
                    }
                  }}
                />
                <button type="submit" className="icon-button"><span className="material-icons">save</span></button>
                <button type="button" className="icon-button" onClick={() => {
                  setEditingCategory(null);
                }}>
                  <span className="material-icons">close</span>
                </button>
              </form>
            ) : (
              <>
                <span>{category.categoryName}</span>
                <div className="actions">
                  <button onClick={() => setEditingCategory(category)} className="icon-button edit-button" title="Редактировать">
                    <span className="material-icons">edit</span>
                  </button>
                  <button onClick={() => handleDeleteCategory(category.uuid)} className="icon-button delete-button" title="Удалить">
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