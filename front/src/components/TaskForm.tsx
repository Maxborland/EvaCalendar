import axios from 'axios'; // Импортируем axios для проверки ошибок
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom'; // Импортируем ReactDOM для Portal
import { IMaskInput } from 'react-imask'; // Импортируем IMaskInput
import { createTask, getAllChildren, getChildByUuid, getExpenseCategories, updateTask, type Child, type ExpenseCategory, type Task } from '../services/api'; // Импортируем функции API
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
      uuid: initialData?.uuid as string | undefined, // UUID can be string or undefined. For new tasks, it will be undefined.
      type: initialData?.type || ('income' as 'income' | 'expense'), // Default value
      title: initialData?.title || ('' as string | null), // Default value
      time: initialData?.time || '',
      address: initialData?.address || '',
      childId: initialData?.childId || (null as string | null), // Заменено childUuid на childId
      childName: '', // Оставлено для отображения, будет заполнено из childUuid
      hourlyRate: initialData?.hourlyRate || 0,
      parentName: '', // Будет заполнено из childId
      parentPhone: '', // Будет заполнено из childId
      comments: initialData?.comments || '',
      category: initialData?.category || '',
      amountEarned: initialData?.amountEarned || 0,
      amountSpent: initialData?.amountSpent || 0,
      hoursWorked: initialData?.hoursWorked || 0,
      dueDate: initialData?.dueDate ?? defaultDueDate, // Используем ?? для более строгого контроля
    };
    return data as typeof data; // Ensure TypeScript infers the correct type including undefined for uuid
  });

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildUuid, setSelectedChildUuid] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      // Используем все поля из initialData, если они есть, иначе значения по умолчанию из useState
      setFormData(prevData => {
        const isNewTask = !initialData?.uuid;

        const processedInitialData = { ...initialData };
        // Удалена логика удаления dueDate из processedInitialData, так как новая логика ниже это обрабатывает корректно.

        // Сначала применяем все из prevData, затем из обработанного initialData,
        // а потом специфичные поля, чтобы сохранить логику prevData для них, если в initialData их нет.
        const newData = {
          ...prevData,
          ...processedInitialData, // uuid здесь может быть из initialData
          // Переопределяем поля, чтобы сохранить логику с || и ?? из prevData,
          // если в initialData соответствующие поля отсутствуют или равны null/undefined.
          uuid: initialData.uuid, // Явно берем uuid из initialData (может быть undefined для новых)
          type: initialData.type || prevData.type,
          title: initialData.title ?? prevData.title,
          time: initialData.time || prevData.time,
          address: initialData.address || prevData.address,
          childId: initialData.childId || prevData.childId,
          hourlyRate: initialData.hourlyRate ?? prevData.hourlyRate,
          comments: initialData.comments || prevData.comments,
          category: initialData.category || prevData.category,
          amountEarned: initialData.amountEarned ?? prevData.amountEarned,
          amountSpent: initialData.amountSpent ?? prevData.amountSpent,
          hoursWorked: initialData.hoursWorked ?? prevData.hoursWorked,
          // dueDate будет установлен ниже
        };

        // Логика для dueDate:
        // Если initialData.dueDate предоставлен, используем его.
        // Иначе, используем prevData.dueDate (которое будет defaultDueDate для новых задач,
        // или текущее значение для существующих, или измененное пользователем).
        if (initialData.dueDate !== undefined) {
          newData.dueDate = initialData.dueDate;
        } else {
          newData.dueDate = prevData.dueDate;
        }

        return newData;
      });
      if (initialData.childId) {
        setSelectedChildUuid(initialData.childId);
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
          // После загрузки детей, если есть initialData.childUuid, найти и установить selectedChildUuid
          if (initialData?.childId) {
            setSelectedChildUuid(initialData.childId);
          // Удаляем логику поиска по childName согласно плану
          // } else if (initialData && 'childName' in initialData && initialData.childName) {
          //   const foundChild = fetchedChildren.find(child => child.childName === initialData.childName);
          //   if (foundChild) {
          //     setSelectedChildUuid(foundChild.uuid);
          //   }
          }
      } catch (error) {
        console.error('Ошибка при загрузке детей:', error);
      }
    };
    fetchChildren();
  }, [initialData]);

  useEffect(() => {
    if (selectedChildUuid !== null) {
      const fetchChildData = async () => {
        try {
          const childData = await getChildByUuid(selectedChildUuid as string);
          setFormData((prevData) => ({
            ...prevData,
            childId: childData.uuid, // Обновляем childId в formData, используя uuid из интерфейса Child
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
  }, [selectedChildUuid, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'childSelect') {
        setSelectedChildUuid(value === '' ? null : value); // значение уже string
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
        // dataToSave.address = formData.address === '' ? undefined : formData.address; // Удалено, чтобы не отправлять на бэкенд
        dataToSave.childId = selectedChildUuid || undefined;
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
                  value={selectedChildUuid !== null ? selectedChildUuid : ''} // значение уже string
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Не выбрано</option>
                  {children.map((child, index) => (
                    <option key={child.uuid ?? index} value={child.uuid ?? ''}> {/* Ключ: child.uuid, если существует, иначе индекс. Значение: child.uuid, если существует, иначе пустая строка. */}
                      {child.childName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Блок полей, зависящих от выбранного ребенка */}
              {selectedChildUuid && (
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