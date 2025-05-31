import axios from 'axios'; // Импортируем axios для проверки ошибок
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom'; // Импортируем ReactDOM для Portal
import { IMaskInput } from 'react-imask'; // Импортируем IMaskInput
import { v4 as uuidv4 } from 'uuid';
import { createTask, getAllChildren, getChildById, getExpenseCategories, updateTask, type Child, type ExpenseCategory, type Task } from '../services/api'; // Импортируем функции API
import './TaskForm.css';

interface TaskFormProps {
  initialData?: Partial<Task> & { type: 'income' | 'expense' }; // Используем Partial<Task> и уточняем type
  // weekId: string; // Удалено
  // dayOfWeek: string; // Удалено
  onTaskSaved: () => void;
  onClose: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ initialData, /* weekId, dayOfWeek, */ onTaskSaved, onClose }) => {
  const [formData, setFormData] = useState(() => {
    const defaultDueDate = new Date().toISOString().split('T')[0]; // Сегодняшняя дата в формате YYYY-MM-DD
    const data = {
      uuid: (initialData?.uuid || uuidv4()) as string | undefined, // UUID can be string or undefined
      type: initialData?.type || ('income' as 'income' | 'expense'), // Default value
      title: initialData?.title || ('' as string | null), // Default value
      time: initialData?.time || '',
      address: initialData?.address || '',
      childId: initialData?.childId || (null as string | null), // Добавлено childId
      childName: '', // Оставлено для отображения, будет заполнено из childId
      hourlyRate: initialData?.hourlyRate || 0,
      parentName: '', // Будет заполнено из childId
      parentPhone: '', // Будет заполнено из childId
      comments: initialData?.comments || '',
      category: initialData?.category || '',
      amountEarned: initialData?.amountEarned || 0,
      amountSpent: initialData?.amountSpent || 0,
      hoursWorked: initialData?.hoursWorked || 0,
      dueDate: initialData?.dueDate || defaultDueDate, // Добавлено поле dueDate
    };
    return data as typeof data; // Ensure TypeScript infers the correct type including undefined for uuid
  });

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      // Используем все поля из initialData, если они есть, иначе значения по умолчанию из useState
      setFormData(prevData => {
        // Создаем новый объект для обновления состояния
        const newUuid = initialData && initialData.uuid !== undefined
                        ? initialData.uuid
                        : (initialData && Object.prototype.hasOwnProperty.call(initialData, 'uuid') // Проверяем, что uuid был явно передан как undefined
                           ? undefined
                           : prevData.uuid);

        const newData = {
          ...prevData,
          ...(initialData || {}),
          uuid: newUuid as string | undefined, // Используем вычисленный newUuid и указываем тип
          type: initialData?.type || prevData.type,
          title: initialData?.title ?? prevData.title, // Используем ?? для title, чтобы сохранить пустую строку из initialData
          time: initialData?.time || prevData.time,
          address: initialData?.address || prevData.address,
          childId: initialData?.childId || prevData.childId,
          hourlyRate: initialData?.hourlyRate ?? prevData.hourlyRate, // Используем ?? для числовых полей, чтобы 0 из initialData не заменялся на prevData
          comments: initialData?.comments || prevData.comments,
          category: initialData?.category || prevData.category,
          amountEarned: initialData?.amountEarned ?? prevData.amountEarned,
          amountSpent: initialData?.amountSpent ?? prevData.amountSpent,
          hoursWorked: initialData?.hoursWorked ?? prevData.hoursWorked,
          dueDate: initialData?.dueDate || prevData.dueDate,
        };
        return newData;
      });
      if (initialData.childId) {
        setSelectedChildId(initialData.childId);
      }
    }
  }, [initialData]);

  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    // Загрузка категорий расходов
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getExpenseCategories();
        setCategories(fetchedCategories.map((cat: ExpenseCategory) => cat.category_name));
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
          // После загрузки детей, если есть initialData.childId, найти и установить selectedChildId
          if (initialData?.childId) {
            setSelectedChildId(initialData.childId);
          } else if (initialData && 'childName' in initialData && initialData.childName) { // Проверяем наличие childName в initialData
            const foundChild = fetchedChildren.find(child => child.childName === initialData.childName);
            if (foundChild) {
              setSelectedChildId(foundChild.id); // Используем id из интерфейса Child
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
          const childData = await getChildById(selectedChildId as string);
          setFormData((prevData) => ({
            ...prevData,
            childId: childData.id, // Обновляем childId в formData, используя id из интерфейса Child
            childName: childData.childName,
            hourlyRate: childData.hourlyRate || 0,
            address: childData.address || '',
            parentName: childData.parentName || '',
            parentPhone: childData.parentPhone || '',
            title: (prevData.title === '' || prevData.title === `Работать с ${prevData.childName}` || prevData.title === null) ? `Работать с ${childData.childName}` : prevData.title,
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
        childId: null, // Сбрасываем childId
        childName: '',
        hourlyRate: 0,
        address: '',
        parentName: '',
        parentPhone: '',
        title: initialData?.title ?? '',
      }));
    }
  }, [selectedChildId, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'childSelect') {
        setSelectedChildId(value === '' ? null : value); // значение уже string
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
      const dataToSave: Task = {
        uuid: formData.uuid,
        // weekId, // Удалено
        // dayOfWeek: parseInt(dayOfWeek, 10), // Удалено
        type: formData.type,
        title: formData.title || '', // title обязателен
        dueDate: formData.dueDate, // Добавляем dueDate
        // Остальные поля добавляются в зависимости от типа
      };

      if (formData.type === 'income') {
        // Для типа 'income' (и других, где это применимо)
        dataToSave.time = formData.time === '' ? undefined : formData.time;
        dataToSave.address = formData.address === '' ? undefined : formData.address;
        dataToSave.childId = selectedChildId || undefined;
        dataToSave.hourlyRate = formData.hourlyRate;
        dataToSave.hoursWorked = formData.hoursWorked;
        dataToSave.comments = formData.comments === '' ? undefined : formData.comments;
        dataToSave.amountEarned = formData.hourlyRate && formData.hoursWorked ? formData.hourlyRate * formData.hoursWorked : 0;
      } else if (formData.type === 'expense') {
        // Для типа 'expense'
        dataToSave.comments = formData.comments === '' ? undefined : formData.comments;
        dataToSave.category = formData.category === '' ? undefined : formData.category;
        dataToSave.amountSpent = formData.amountSpent;
      }

      console.log('Sending data:', dataToSave); // Логируем отправляемые данные

      if (formData.uuid) {
        // Обновление существующей задачи
        await updateTask(formData.uuid, dataToSave);
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
          <h2>{formData.uuid ? 'Редактировать дело' : 'Создать новое дело'}</h2>

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

          <div className="form-group">
            <label htmlFor="dueDate" className="label">Дата выполнения:</label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          {formData.type === 'income' && (
            <>
              <div className="form-group">
                <label htmlFor="childSelect" className="label">Выбрать ребенка:</label>
                <select
                  id="childSelect"
                  name="childSelect"
                  value={selectedChildId !== null ? selectedChildId : ''} // значение уже string
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Не выбрано</option>
                  {children.map((child, index) => (
                    <option key={child.id ?? index} value={child.id ?? ''}> {/* Ключ: child.id, если существует, иначе индекс. Значение: child.id, если существует, иначе пустая строка. */}
                      {child.childName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Блок полей, зависящих от выбранного ребенка */}
              {selectedChildId && (
                <>
                  <div className="form-group"> {/* Имя ребенка */}
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
                <IMaskInput
                  mask={'+{7} (000) 000-00-00'}
                  value={formData.parentPhone || ''}
                  onAccept={(value: string) => {
                    setFormData((prevData) => ({
                      ...prevData,
                      parentPhone: value,
                    }));
                  }}
                  name="parentPhone"
                  id="parentPhone"
                  type="tel"
                  className="input"
                  readOnly // Только для чтения
                />
              </div>
              {/* Адрес и Ставка также должны быть внутри этого блока */}
              <div className="form-group"> {/* Адрес */}
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

              <div className="form-group"> {/* Ставка */}
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
                </>
              )}
              {/* Поля Название и Время остаются видимыми */}
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

              {/* Поле "Часов отработано" не зависит от выбора ребенка и должно быть здесь */}
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
                  ))}{" "}
                </select>
              </div>
            </>
          )}

          <button type="submit" className="submit-button">
            {formData.uuid ? 'Сохранить' : 'Создать дело'}
          </button>
        </form>
      </div>
    </div>
  );

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    return null; // Или выбросить ошибку, если modal-root не найден
  }

  // Используем ReactDOM.createPortal для рендеринга модального окна вне основного DOM-потока.
  // Это помогает избежать проблем с z-index и позиционированием.
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default TaskForm;