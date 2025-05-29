import React, { useEffect, useState } from 'react';
import { createTask, updateTask } from '../services/api'; // Импортируем функции API
import './TaskForm.css';

interface TaskFormProps {
  initialData?: {
    id?: string;
    type: 'income' | 'expense';
    title?: string; // Для income
    time?: string; // Для income
    address?: string; // Для income
    childName?: string; // Для income
    hourlyRate?: number; // Для income
    comments?: string; // Для income
    category?: string;
    amountEarned?: number;
    amountSpent?: number;
    hoursWorked?: number; // Новое поле для часов работы
  };
  weekId: string;
  dayOfWeek: string;
  onTaskSaved: () => void;
  onClose: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ initialData, weekId, dayOfWeek, onTaskSaved, onClose }) => {
  const [formData, setFormData] = useState(initialData || {
    id: undefined,
    type: 'income',
    title: '',
    time: '',
    address: '',
    childName: '',
    hourlyRate: undefined, // Изменено на undefined
    comments: '',
    category: '',
    amountEarned: undefined, // Изменено на undefined
    amountSpent: undefined, // Изменено на undefined
    hoursWorked: undefined, // Изменено на undefined
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: (name === 'hourlyRate' || name === 'amountEarned' || name === 'amountSpent' || name === 'hoursWorked') ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        // Обновление существующей задачи
        const dataToSave = { ...formData, weekId, dayOfWeek };
        // Рассчитываем amountEarned перед отправкой, если это доход
        if (dataToSave.type === 'income' && dataToSave.hourlyRate && dataToSave.hoursWorked) {
          dataToSave.amountEarned = dataToSave.hourlyRate * dataToSave.hoursWorked;
        }
        await updateTask(formData.id, dataToSave);
      } else {
        // Создание новой задачи
        const dataToSave = { ...formData, weekId, dayOfWeek };
        // Рассчитываем amountEarned перед отправкой, если это доход
        if (dataToSave.type === 'income' && dataToSave.hourlyRate && dataToSave.hoursWorked) {
          dataToSave.amountEarned = dataToSave.hourlyRate * dataToSave.hoursWorked;
        }
        await createTask(dataToSave);
      }
      onTaskSaved(); // Вызываем обратный вызов после сохранения
      onClose();
    } catch (error) {
      console.error('Ошибка при сохранении задачи:', error);
      // Возможно, добавить сообщение об ошибке для пользователя
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
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
                />
              </div>

              <div className="form-group">
                <label htmlFor="childName" className="label">Имя ребенка:</label>
                <input
                  type="text"
                  id="childName"
                  name="childName"
                  value={formData.childName || ''}
                  onChange={handleChange}
                  className="input"
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
                <label htmlFor="amountEarned" className="label">Заработано (расчетное):</label>
                <input
                  type="number"
                  id="amountEarned"
                  name="amountEarned"
                  value={formData.amountEarned ?? ''}
                  step="0.01"
                  min="0"
                  placeholder="0"
                  className="input"
                  readOnly // Поле только для чтения, т.к. оно расчетное
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
                  name="title"
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
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category || ''}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </>
          )}

          <button type="submit" className="submit-button">
            {formData.id ? 'Сохранить изменения' : 'Создать дело'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;