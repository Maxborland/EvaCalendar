import axios from 'axios'; // Импортируем axios для проверки ошибок
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom'; // Импортируем ReactDOM для Portal
import { createTask, getAllChildren, getChildById, getExpenseCategories, updateTask, type Child } from '../services/api'; // Импортируем функции API
import './TaskForm.css';

interface TaskFormProps {
  initialData?: {
    id?: string;
    type: 'income' | 'expense';
    title?: string | null; // Для income - может быть null
    time?: string; // Для income
    address?: string; // Для income
    childName?: string; // Для income
    hourlyRate?: number; // Для income
    parentName?: string; // Новое поле
    parentPhone?: string; // Новое поле
    comments?: string; // Для income, А ТАКЖЕ для expense
    category?: string; // Для expense
    amountEarned?: number; // Для income
    amountSpent?: number; // Для expense
    hoursWorked?: number; // Новое поле для часов работы
  };
  weekId: string;
  dayOfWeek: string;
  onTaskSaved: () => void;
  onClose: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ initialData, weekId, dayOfWeek, onTaskSaved, onClose }) => {
  const [formData, setFormData] = useState({
    id: undefined as string | undefined, // Default value, может быть string или undefined
    type: 'income' as 'income' | 'expense', // Default value
    title: '' as string | null, // Default value
    time: '',
    address: '',
    childName: '',
    hourlyRate: 0,
    parentName: '',
    parentPhone: '',
    comments: '',
    category: '',
    amountEarned: 0,
    amountSpent: 0,
    hoursWorked: 0,
  });

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        type: initialData.type,
        title: initialData.title ?? '',
        time: initialData.time || '',
        address: initialData.address || '',
        childName: initialData.childName || '',
        hourlyRate: initialData.hourlyRate || 0,
        parentName: initialData.parentName || '',
        parentPhone: initialData.parentPhone || '',
        comments: initialData.comments || '',
        category: initialData.category || '',
        amountEarned: initialData.amountEarned || 0,
        amountSpent: initialData.amountSpent || 0,
        hoursWorked: initialData.hoursWorked || 0,
      });
    }
  }, [initialData]);

  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    // Загрузка категорий расходов
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getExpenseCategories();
        setCategories(fetchedCategories.map((cat:any) => cat.category_name));
      } catch (error) {
        console.error('Ошибка при загрузке категорий:', error);
      }
    };
    fetchCategories();

    // Загрузка списка детей
    const fetchChildren = async () => {
      try {
        const fetchedChildren = await getAllChildren();
        setChildren(fetchedChildren);
          // После загрузки детей, если есть initialData.childName, найти и установить selectedChildId
          if (initialData?.childName) {
            const foundChild = fetchedChildren.find(child => child.childName === initialData.childName);
            if (foundChild) {
              setSelectedChildId(foundChild.id);
            }
          }
      } catch (error) {
        console.error('Ошибка при загрузке детей:', error);
      }
    };
    fetchChildren();
  }, [initialData]);

  useEffect(() => {
    if (selectedChildId !== null) {
      const fetchChildData = async () => {
        try {
          const childData = await getChildById(selectedChildId);
          setFormData((prevData) => ({
            ...prevData,
            childName: childData.childName,
            hourlyRate: childData.hourlyRate || 0, // Установим hourlyRate, если есть
            address: childData.address || '',
            parentName: childData.parentName || '', // Предзаполняем имя родителя
            parentPhone: childData.parentPhone || '', // Предзаполняем телефон родителя
            title: (prevData.title === '' || prevData.title === `Работать с ${prevData.childName}` || prevData.title === null) ? `Работать с ${childData.childName}` : prevData.title, // Предзаполняем название. Добавлено `prevData.title === null` для обработки null
          }));
        } catch (error) {
          console.error('Ошибка при загрузке данных ребенка:', error);
        }
      };
      fetchChildData();
    } else {
      // Сбросить поля, если ребенок не выбран
      setFormData((prevData) => ({
        ...prevData,
        childName: '',
        hourlyRate: 0,
        address: '',
        parentName: '', // Сбрасываем имя родителя
        parentPhone: '', // Сбрасываем телефон родителя
        title: initialData?.title ?? '', // Сбрасываем title, если не было initialData (используем ?? для null и undefined)
      }));
    }
  }, [selectedChildId, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'childSelect') {
        setSelectedChildId(value === '' ? null : parseInt(value));
    } else {
        setFormData((prevData) => ({
            ...prevData,
            [name]: (name === 'hourlyRate' || name === 'amountEarned' || name === 'amountSpent' || name === 'hoursWorked')
                ? (value === '' ? 0 : parseFloat(value)) // Преобразуем пустую строку в 0 для числовых полей
                : value,
        }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let dataToSave: any = {
        id: formData.id,
        weekId,
        dayOfWeek,
        type: formData.type,
      };

      if (formData.type === 'income') {
        dataToSave = {
          ...dataToSave,
          title: formData.title,
          time: formData.time === '' ? null : formData.time,
          address: formData.address === '' ? null : formData.address,
          childName: formData.childName === '' ? null : formData.childName,
          hourlyRate: formData.hourlyRate,
          hoursWorked: formData.hoursWorked,
          comments: formData.comments,
          amountEarned: formData.hourlyRate && formData.hoursWorked ? formData.hourlyRate * formData.hoursWorked : 0,
        };
      } else if (formData.type === 'expense') {
        dataToSave = {
          ...dataToSave,
          title: formData.title, // 'Описание расхода' на фронтенде
          comments: formData.comments, // 'Комментарии' на фронтенде
          category: formData.category === '' ? null : formData.category,
          amountSpent: formData.amountSpent,
        };
      }

      console.log('Sending data:', dataToSave); // Логируем отправляемые данные

      if (formData.id) {
        // Обновление существующей задачи
        await updateTask(formData.id, dataToSave);
      } else {
        // Создание новой задачи
        await createTask(dataToSave);
      }
      onTaskSaved(); // Вызываем обратный вызов после сохранения
      onClose();
    } catch (error) {
      console.error('Ошибка при сохранении задачи:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Статус ответа:', error.response.status);
        console.error('Данные ответа:', error.response.data);
      } else {
        console.error('Неизвестная ошибка:', error);
      }
      // Возможно, добавить сообщение об ошибке для пользователя
    }
  };

  const modalContent = (
    <div className="modal-overlay" onClick={onClose} data-testid="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>&times;</button>
        <form className="form" onSubmit={handleSubmit}>
          <h2>{formData.id ? 'Редактировать дело' : 'Создать новое дело'}</h2>

          <div className="form-group">
            <label htmlFor="type" className="label">Тип:</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="input"
            >
              <option value="income">Доход</option>
              <option value="expense">Расход</option>
            </select>
          </div>

          {formData.type === 'income' && (
            <>
              <div className="form-group">
                <label htmlFor="childSelect" className="label">Выбрать ребенка:</label>
                <select
                  id="childSelect"
                  name="childSelect"
                  value={selectedChildId !== null ? selectedChildId.toString() : ''}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Не выбрано</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.childName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Поле для отображения имени ребенка, будет заполняться из выбранного ребенка */}
              <div className="form-group">
                <label htmlFor="childName" className="label">Имя ребенка:</label>
                <input
                  type="text"
                  id="childName"
                  name="childName"
                  value={formData.childName || ''}
                  onChange={handleChange}
                  className="input"
                  readOnly // Это поле только для чтения
                />
              </div>

              {/* Новое поле для имени родителя */}
              <div className="form-group">
                <label htmlFor="parentName" className="label">Имя родителя:</label>
                <input
                  type="text"
                  id="parentName"
                  name="parentName"
                  value={formData.parentName || ''}
                  onChange={handleChange}
                  className="input"
                  readOnly // Только для чтения
                />
              </div>

              {/* Новое поле для телефона родителя */}
              <div className="form-group">
                <label htmlFor="parentPhone" className="label">Телефон родителя:</label>
                <input
                  type="tel" // Используем тип tel для лучшей семантики
                  id="parentPhone"
                  name="parentPhone"
                  value={formData.parentPhone || ''}
                  onChange={handleChange}
                  className="input"
                  readOnly // Только для чтения
                />
              </div>

              <div className="form-group">
                <label htmlFor="title" className="label">Название:</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="time" className="label">Время:</label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time || ''}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address" className="label">Адрес:</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  className="input"
                  readOnly // Это поле будет заполняться из выбранного ребенка
                />
              </div>

              <div className="form-group">
                <label htmlFor="hourlyRate" className="label">Ставка (₽/час):</label>
                <input
                  type="number"
                  id="hourlyRate"
                  name="hourlyRate"
                  value={formData.hourlyRate ?? ''}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0"
                  className="input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="hoursWorked" className="label">Часов отработано:</label>
                <input
                  type="number"
                  id="hoursWorked"
                  name="hoursWorked"
                  value={formData.hoursWorked ?? ''}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0"
                  className="input"
                />
              </div>


              <div className="form-group">
                <label htmlFor="comments" className="label">Комментарии:</label>
                <textarea
                  id="comments"
                  name="comments"
                  value={formData.comments || ''}
                  onChange={handleChange}
                  className="textarea"
                />
              </div>
            </>
          )}

          {formData.type === 'expense' && (
            <>
              <div className="form-group">
                <label htmlFor="title" className="label">Описание расхода:</label>
                <input
                  type="text"
                  id="title"
                  name="title" // Используем name для описания расхода.
                  value={formData.title || ''} // Используем title для описания расхода
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="amountSpent" className="label">Потрачено:</label>
                <input
                  type="number"
                  id="amountSpent"
                  name="amountSpent"
                  value={formData.amountSpent ?? ''} // Используем amountSpent
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  placeholder="0"
                  className="input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="comments" className="label">Комментарии:</label>
                <textarea
                  id="comments"
                  name="comments"
                  value={formData.comments || ''} // Используем comments для расходов
                  onChange={handleChange}
                  className="textarea"
                />
              </div>

              <div className="form-group">
                <label htmlFor="category" className="label">Категория:</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category || ''}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button type="submit" className="submit-button">
            {formData.id ? 'Сохранить' : 'Создать дело'}
          </button>
        </form>
      </div>
    </div>
  );

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    return null; // Или выбросить ошибку, если modal-root не найден
  }

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default TaskForm;