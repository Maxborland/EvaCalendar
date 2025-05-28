import React, { useEffect, useState } from 'react';
import type { Task } from '../context/AppContext';
import { useAppContext } from '../context/AppContext';
import './TaskForm.css';

interface TaskFormProps {
  initialTask?: Task;
  onClose: () => void;
  onSave: (task: Task) => Promise<void>;
  dayOfWeek: number;
  weekStart: string;
  date: string;
  position: number;
}

const TaskForm: React.FC<TaskFormProps> = ({ initialTask, onClose, onSave, dayOfWeek, weekStart, date, position }) => {
  const { categories } = useAppContext();
  const [taskData, setTaskData] = useState<Task>({
    weekStart: initialTask?.weekStart || weekStart,
    dayOfWeek: initialTask?.dayOfWeek || dayOfWeek,
    date: initialTask?.date || date,
    position: initialTask?.position || position,
    type: initialTask?.type || 'order', // Default to 'order'
    title: initialTask?.title || '',
    time: initialTask?.time || '',
    address: initialTask?.address || '',
    childName: initialTask?.childName || '',
    hourlyRate: initialTask?.hourlyRate || 0,
    amount: initialTask?.amount || 0,
    comment: initialTask?.comment || '',
    category: initialTask?.category || (categories.length > 0 ? categories[0].name : ''),
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTask) {
      setTaskData(initialTask);
    } else {
      // Reset form for new task, ensure category is set if categories are loaded
      setTaskData(prev => ({
        ...prev,
        category: categories.length > 0 ? categories[0].name : '',
      }));
    }
  }, [initialTask, categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTaskData((prev) => ({
      ...prev,
      [name]: name === 'hourlyRate' || name === 'amount' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!taskData.title) {
      setError('Название обязательно.');
      return;
    }
    if (taskData.type === 'order' && (!taskData.time || !taskData.address || !taskData.childName || taskData.hourlyRate === undefined)) {
      setError('Для заказа обязательны время, адрес, имя ребенка и ставка.');
      return;
    }
    if (taskData.type === 'expense' && (taskData.amount === undefined || !taskData.category)) {
      setError('Для траты обязательны сумма и категория.');
      return;
    }

    try {
      await onSave(taskData);
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="task-form-overlay">
      <form className="task-form" onSubmit={handleSubmit}>
        <h2>{initialTask ? 'Редактировать дело' : 'Добавить новое дело'}</h2>
        {error && <p className="error-message">{error}</p>}

        <div className="form-group">
          <label htmlFor="type">Тип:</label>
          <select id="type" name="type" value={taskData.type} onChange={handleChange}>
            <option value="order">Заказ</option>
            <option value="expense">Трата</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="title">Название:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={taskData.title}
            onChange={handleChange}
            required
          />
        </div>

        {taskData.type === 'order' && (
          <>
            <div className="form-group">
              <label htmlFor="time">Время:</label>
              <input
                type="time"
                id="time"
                name="time"
                value={taskData.time}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="address">Адрес:</label>
              <input
                type="text"
                id="address"
                name="address"
                value={taskData.address}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="childName">Имя ребенка:</label>
              <input
                type="text"
                id="childName"
                name="childName"
                value={taskData.childName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="hourlyRate">Ставка в час (₽):</label>
              <input
                type="number"
                id="hourlyRate"
                name="hourlyRate"
                value={taskData.hourlyRate}
                onChange={handleChange}
                step="0.01"
                required
              />
            </div>
          </>
        )}

        {taskData.type === 'expense' && (
          <>
            <div className="form-group">
              <label htmlFor="amount">Сумма (₽):</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={taskData.amount}
                onChange={handleChange}
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="category">Категория:</label>
              <select
                id="category"
                name="category"
                value={taskData.category}
                onChange={handleChange}
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="form-group">
          <label htmlFor="comment">Комментарий:</label>
          <textarea
            id="comment"
            name="comment"
            value={taskData.comment}
            onChange={handleChange}
            rows={3}
          ></textarea>
        </div>

        <div className="form-actions">
          <button type="submit">Сохранить</button>
          <button type="button" onClick={onClose}>Отмена</button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;