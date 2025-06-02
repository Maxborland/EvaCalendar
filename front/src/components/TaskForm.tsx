import axios from 'axios'; // Импортируем axios для проверки ошибок
import React, { useCallback, useEffect, useState } from 'react'; // Добавлен useCallback
import ReactDOM from 'react-dom'; // Импортируем ReactDOM для Portal
import { toast } from 'react-toastify'; // Для уведомлений из ChildForm
import { addChild, createTask, getAllChildren, getChildByUuid, getExpenseCategories, updateChild as updateChildAPI, updateTask, type Child, type ExpenseCategory, type Task } from '../services/api'; // Импортируем функции API, addChild, updateChild as updateChildAPI
import ChildForm from './ChildForm'; // Импорт ChildForm
import './TaskForm.css';
import UnifiedChildSelector from './UnifiedChildSelector'; // Импорт нового компонента

interface TaskFormProps {
  initialData?: Partial<Task> & { type: 'income' | 'expense' };
  onTaskSaved: () => void;
  onClose: () => void;
  onDelete?: (id: string, itemType: 'task' | 'expense') => void; // Добавлено
  onDuplicate?: (id: string, itemType: 'task' | 'expense') => void; // Добавлено
}

const TaskForm: React.FC<TaskFormProps> = ({ initialData, onTaskSaved, onClose, onDelete, onDuplicate }) => { // Добавлены onDelete, onDuplicate
  const [formData, setFormData] = useState(() => {
    const defaultDueDate = new Date().toISOString().split('T')[0];
    const data = {
      uuid: initialData?.uuid as string | undefined,
      type: initialData?.type || ('income' as 'income' | 'expense'),
      title: initialData?.title || ('' as string | null),
      time: initialData?.time || '',
      address: initialData?.address || '', // Это поле будет заполняться из данных ребенка
      childId: initialData?.childId || (null as string | null),
      // childName: '', // Удалено, так как имя будет браться из UnifiedChildSelector или children list
      hourlyRate: initialData?.hourlyRate || 0, // Это поле будет заполняться из данных ребенка
      parentName: '', // Это поле будет заполняться из данных ребенка
      parentPhone: '', // Это поле будет заполняться из данных ребенка
      comments: initialData?.comments || '',
      category: initialData?.expenseCategoryName || initialData?.category || '',
      amountEarned: initialData?.amountEarned || 0,
      amountSpent: initialData?.amountSpent || 0,
      hoursWorked: initialData?.hoursWorked || 0,
      dueDate: initialData?.dueDate ?? defaultDueDate,
    };
    return data as typeof data;
  });

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildUuid, setSelectedChildUuid] = useState<string | null>(initialData?.childId || null);
  const [selectedChildDetails, setSelectedChildDetails] = useState<Child | null>(null); // Новое состояние для данных ребенка

  const [showChildFormModal, setShowChildFormModal] = useState(false);
  const [childFormInitialData, setChildFormInitialData] = useState<Partial<Child> | undefined>(undefined);


  // Обертка для fetchChildren, чтобы использовать в useCallback
  const fetchChildrenCallback = useCallback(async () => {
    try {
      const fetchedChildren = await getAllChildren();
      setChildren(fetchedChildren);
      // Если при инициализации был childId, он уже установлен в selectedChildUuid
      // Если после добавления нового ребенка нужно его выбрать, это будет сделано в handleChildFormSave
    } catch (error) {
      console.error('Ошибка при загрузке детей:', error);
      toast.error('Ошибка при загрузке списка детей.');
    }
  }, []);


  useEffect(() => {
    if (initialData) {
      setFormData(prevData => {
        const processedInitialData = { ...initialData };
        const newData = {
          ...prevData,
          ...processedInitialData,
          uuid: initialData.uuid,
          type: initialData.type || prevData.type,
          title: initialData.title ?? prevData.title,
          time: initialData.time || prevData.time,
          // address, hourlyRate, parentName, parentPhone будут установлены из useEffect для selectedChildUuid
          childId: initialData.childId || prevData.childId,
          comments: initialData.comments || prevData.comments,
          category: initialData.expenseCategoryName || initialData.category || prevData.category,
          amountEarned: initialData.amountEarned ?? prevData.amountEarned,
          amountSpent: initialData.amountSpent ?? prevData.amountSpent,
          hoursWorked: initialData.hoursWorked ?? prevData.hoursWorked,
        };
        if (initialData.dueDate !== undefined) {
          newData.dueDate = initialData.dueDate;
        } else {
          newData.dueDate = prevData.dueDate;
        }
        return newData;
      });
      // selectedChildUuid устанавливается при инициализации useState
    }
  }, [initialData]);

  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getExpenseCategories();
        setCategories(fetchedCategories.map((cat: ExpenseCategory) => cat.category_name));
      } catch (error) {
        console.error('Ошибка при загрузке категорий:', error);
      }
    };
    fetchCategories();
    fetchChildrenCallback(); // Используем callback-версию
  }, [fetchChildrenCallback]); // Зависимость от callback-версии

  useEffect(() => {
    if (selectedChildUuid !== null) {
      const fetchChildDataAndUpdateForm = async () => {
        try {
          const childData = await getChildByUuid(selectedChildUuid as string);
          const currentChildName = children.find(c => c.uuid === selectedChildUuid)?.childName || childData.childName;
          setSelectedChildDetails(childData); // Сохраняем полные данные ребенка

          setFormData((prevData) => ({
            ...prevData,
            childId: childData.uuid,
            // childName: childData.childName, // Удалено
            hourlyRate: childData.hourlyRate || 0,
            address: childData.address || '', // Это поле остается в formData для совместимости, но не будет отображаться отдельно
            parentName: childData.parentName || '', // Это поле остается в formData для совместимости, но не будет отображаться отдельно
            parentPhone: childData.parentPhone || '', // Это поле остается в formData для совместимости, но не будет отображаться отдельно
            // Обновляем title только если он был пуст или содержал старое имя ребенка
            title: currentChildName
          }));
        } catch (error) {
          console.error('Ошибка при загрузке данных ребенка:', error);
          toast.error('Ошибка при загрузке данных ребенка.');
          setSelectedChildUuid(null); // Сбрасываем выбор, если не удалось загрузить
          setSelectedChildDetails(null); // Сбрасываем данные ребенка
        }
      };
      fetchChildDataAndUpdateForm();
    } else {
      setSelectedChildDetails(null); // Сбрасываем данные ребенка, если UUID сброшен
      setFormData((prevData) => ({
        ...prevData,
        childId: null,
        // childName: '', // Удалено
        hourlyRate: 0,
        address: '',
        parentName: '',
        parentPhone: '',
        // Сбрасываем title, если он был связан с ребенком, или используем initialData.title
        title: initialData?.title && !initialData.title.startsWith('Работать с ') ? initialData.title : '',
      }));
    }
  }, [selectedChildUuid, initialData, children]); // Добавили children в зависимости

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Удаляем старую логику для childSelect
    setFormData((prevData) => ({
      ...prevData,
      [name]: (name === 'hourlyRate' || name === 'amountEarned' || name === 'amountSpent' || name === 'hoursWorked')
        ? (value === '' ? 0 : parseFloat(value))
        : value,
    }));
  };

  const handleUnifiedChildChange = (childId: string | null, _newChildName?: string) => {
    // _newChildName здесь не используется, так как создание инициируется через onAddNewChildRequest
    setSelectedChildUuid(childId);
  };

  const handleOpenChildFormForNew = (childName: string) => {
    setChildFormInitialData({ childName }); // Предзаполняем имя
    setShowChildFormModal(true);
  };

  const handleOpenChildFormDefault = () => {
    setChildFormInitialData({}); // Пустая форма для нового ребенка
    setShowChildFormModal(true);
  };

  const handleChildFormSave = async (childDataFromForm: Child | Partial<Child>) => {
    try {
      let savedOrUpdatedChild: Child;
      if (childDataFromForm.uuid) { // Обновление существующего (маловероятно из TaskForm, но возможно)
        savedOrUpdatedChild = await updateChildAPI(childDataFromForm.uuid, childDataFromForm as Child);
        toast.success('Карточка ребенка успешно обновлена!');
      } else { // Создание нового
        const { uuid, ...dataToSend } = childDataFromForm; // Убираем uuid если он там случайно есть
        savedOrUpdatedChild = await addChild(dataToSend as Omit<Child, 'uuid'>);
        toast.success('Новая карточка ребенка успешно добавлена!');
      }
      setShowChildFormModal(false);
      await fetchChildrenCallback(); // Обновляем список детей
      setSelectedChildUuid(savedOrUpdatedChild.uuid); // Автоматически выбираем нового/обновленного ребенка
    } catch (error) {
      toast.error('Ошибка при сохранении карточки ребенка.');
      console.error("Ошибка при сохранении карточки ребенка из TaskForm:", error);
    }
  };

  const handleChildFormCancel = () => {
    setShowChildFormModal(false);
    setChildFormInitialData(undefined);
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

  const handleDelete = () => {
    if (formData.uuid && onDelete && window.confirm('Вы уверены, что хотите удалить это дело?')) {
      onDelete(formData.uuid, formData.type as 'task' | 'expense');
      onClose();
    }
  };

  const handleDuplicate = () => {
    if (formData.uuid && onDuplicate) {
      onDuplicate(formData.uuid, formData.type as 'task' | 'expense');
      onClose();
    }
  };

  const modalContent = (
    <>
      <div className="modal-overlay" onClick={onClose} data-testid="modal-overlay">
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-button" onClick={onClose}>&times;</button>
          <form className="form" onSubmit={handleSubmit}>
            <h2>{formData.uuid ? 'Редактировать дело' : 'Создать новое дело'}</h2>

            <div className="form-group">
              <label htmlFor="title" className="label">Название дела:</label>
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
              <label htmlFor="dueDate" className="label">Дата:</label>
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

            {formData.type === 'income' && (
              <>
                <UnifiedChildSelector
                  value={selectedChildUuid}
                  onChange={handleUnifiedChildChange}
                  childrenList={children}
                  onAddNewChildRequest={handleOpenChildFormForNew}
                  onGoToCreateChildPageRequest={handleOpenChildFormDefault}
                  label="Ребенок:"
                  placeholder="Введите или выберите имя ребенка"
                  selectedChildDetails={selectedChildDetails}
                />

                <div className="form-group">
                  <label htmlFor="hoursWorked" className="label">Часов:</label>
                  <input
                    type="number"
                    id="hoursWorked"
                    name="hoursWorked"
                    value={formData.hoursWorked ?? 0}
                    onChange={handleChange}
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

            <div className="form-actions">
              {formData.uuid && onDelete && (
                <button type="button" className="delete-button-form" onClick={handleDelete}>
                  Удалить
                </button>
              )}
              {formData.uuid && onDuplicate && (
                <button type="button" className="duplicate-button-form" onClick={handleDuplicate}>
                  Дублировать
                </button>
              )}
              <button type="submit" className="submit-button">
                {formData.uuid ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {showChildFormModal && (
        <div className="modal-overlay" onClick={handleChildFormCancel} data-testid="child-form-modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={handleChildFormCancel}>&times;</button>
            <ChildForm
              initialChild={childFormInitialData}
              onSave={handleChildFormSave}
              onCancel={handleChildFormCancel}
            />
          </div>
        </div>
      )}
    </>
  );

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    // Если modal-root не найден, можно создать его динамически или вернуть null/ошибку
    // Для простоты пока возвращаем null, но в реальном приложении это нужно обработать надежнее.
    console.error("Элемент с id 'modal-root' не найден в DOM.");
    return null;
  }
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default TaskForm;