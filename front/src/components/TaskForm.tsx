import React, { useEffect, useState } from 'react';
import './TaskForm.css';

interface TaskFormProps {
  initialData?: {
    id?: string;
    type: 'income' | 'expense'; // 'Доход' или 'Расход'
    title?: string; // Для дохода
    time?: string; // Для дохода
    address?: string; // Для дохода
    childName?: string; // Для дохода
    hourlyRate?: number; // Для дохода
    comments?: string; // Для дохода
    what?: string; // Для расхода
    amount?: number; // Для расхода
    expenseComments?: string; // Для расхода
  };
  onSave: (data: any) => void;
  onClose: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ initialData, onSave, onClose }) => {
  const [formData, setFormData] = useState(initialData || {
    id: undefined,
    type: 'income', // По умолчанию "Доход"
    title: '',
    time: '',
    address: '',
    childName: '',
    hourlyRate: 0,
    comments: '',
    what: '',
    amount: 0,
    expenseComments: '',
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
      [name]: (name === 'hourlyRate' || name === 'amount') ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
                <label htmlFor="hourlyRate" className="label">Ставка (рублей/час):</label>
                <input
                  type="number"
                  id="hourlyRate"
                  name="hourlyRate"
                  value={formData.hourlyRate || 0}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
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
                <label htmlFor="what" className="label">Что:</label>
                <input
                  type="text"
                  id="what"
                  name="what"
                  value={formData.what || ''}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="amount" className="label">Сколько:</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount || 0}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  className="input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="expenseComments" className="label">Комментарий:</label>
                <textarea
                  id="expenseComments"
                  name="expenseComments"
                  value={formData.expenseComments || ''}
                  onChange={handleChange}
                  className="textarea"
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