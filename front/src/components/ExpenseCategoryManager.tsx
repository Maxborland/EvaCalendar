import clsx from 'clsx';
import { useState, type FormEvent } from 'react';
import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
  useDeleteExpenseCategory
} from '../hooks/useExpenseCategories';
import type { ExpenseCategory } from '../services/api';
import { getTasksByCategory } from '../services/api';

const inputClass =
  'w-full rounded-xl border border-border-subtle bg-surface-elevated text-text-primary py-2.5 px-3 text-sm transition-all duration-[180ms] placeholder:text-text-tertiary focus-visible:outline-none focus-visible:border-border-focus focus-visible:shadow-[0_0_0_3px_rgba(72,187,120,0.16)]';

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

  if (isLoading) {
    return <p className="text-text-secondary text-center py-8 text-base">Загрузка...</p>;
  }

  return (
    <div className="flex flex-col w-full gap-6">
      <form
        onSubmit={handleCreateCategory}
        className="flex gap-3 w-full max-[480px]:flex-col max-[480px]:gap-2"
      >
        <input
          className={clsx(inputClass, 'flex-1 !text-base !rounded-xl !py-3')}
          type="text"
          placeholder="Новая категория"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
        />
        <button
          type="submit"
          className={clsx(
            'inline-flex items-center gap-2 py-2.5 px-5 min-h-11 rounded-xl border-none text-sm font-semibold cursor-pointer',
            'bg-gradient-to-br from-btn-primary-bg to-[var(--theme-primary)] text-btn-primary-text shadow-glass',
            'transition-all duration-[180ms]',
            'hover:-translate-y-0.5 hover:shadow-elevation-2',
            'active:translate-y-0',
            'max-[480px]:w-full',
          )}
        >
          <span className="material-icons text-[20px]">add</span>
          Добавить
        </button>
      </form>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="material-icons text-3xl text-text-tertiary">category</span>
          <p className="text-text-secondary text-sm">Категории расходов пока не добавлены</p>
        </div>
      ) : (
        <ul className="w-full list-none p-0 m-0 flex flex-col gap-3">
          {categories.map((category, index) => (
            <li
              key={category.uuid || `category-${index}`}
              className={clsx(
                'flex justify-between items-center py-3 px-4 max-[480px]:py-2 max-[480px]:px-3',
                'bg-surface-raised border border-border-subtle rounded-xl shadow-glass',
                'transition-all duration-[180ms]',
                'hover:border-border-strong hover:shadow-elevation-1 hover:-translate-y-px',
              )}
            >
              {editingCategory?.uuid === category.uuid ? (
                <form onSubmit={handleUpdateCategory} className="flex gap-2 w-full items-center">
                  <input
                    type="text"
                    className={clsx(inputClass, 'flex-1 !rounded-[10px]')}
                    value={editingCategory?.categoryName || ''}
                    onChange={(e) => {
                      if (editingCategory) {
                        setEditingCategory({ ...editingCategory, categoryName: e.target.value });
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className={clsx(
                      'size-10 rounded-[10px] border border-border-subtle bg-white/[0.04]',
                      'text-text-secondary inline-flex items-center justify-center cursor-pointer shrink-0',
                      'transition-all duration-[160ms]',
                      'hover:-translate-y-px hover:bg-white/[0.08] hover:border-border-strong',
                      'active:translate-y-0',
                    )}
                  >
                    <span className="material-icons text-[20px]">save</span>
                  </button>
                  <button
                    type="button"
                    className={clsx(
                      'size-10 rounded-[10px] border border-border-subtle bg-white/[0.04]',
                      'text-text-secondary inline-flex items-center justify-center cursor-pointer shrink-0',
                      'transition-all duration-[160ms]',
                      'hover:-translate-y-px hover:bg-white/[0.08] hover:border-border-strong',
                      'active:translate-y-0',
                    )}
                    onClick={() => {
                      setEditingCategory(null);
                    }}
                  >
                    <span className="material-icons text-[20px]">close</span>
                  </button>
                </form>
              ) : (
                <>
                  <span className="text-text-primary text-base font-medium leading-normal max-[480px]:text-sm">
                    {category.categoryName}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingCategory(category)}
                      className={clsx(
                        'size-10 rounded-[10px] border border-border-subtle bg-white/[0.04]',
                        'text-text-secondary inline-flex items-center justify-center cursor-pointer shrink-0',
                        'transition-all duration-[160ms]',
                        'hover:-translate-y-px hover:bg-income-bg hover:border-income-border hover:text-income-primary',
                        'active:translate-y-0',
                      )}
                      title="Редактировать"
                    >
                      <span className="material-icons text-[20px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.uuid)}
                      className={clsx(
                        'size-10 rounded-[10px] border border-border-subtle bg-white/[0.04]',
                        'text-text-secondary inline-flex items-center justify-center cursor-pointer shrink-0',
                        'transition-all duration-[160ms]',
                        'hover:-translate-y-px hover:bg-expense-bg hover:border-expense-border hover:text-expense-primary',
                        'active:translate-y-0',
                      )}
                      title="Удалить"
                    >
                      <span className="material-icons text-[20px]">delete</span>
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ExpenseCategoryManager;
