import React, { useCallback, useEffect, useState } from 'react'; // Добавлен useCallback
import ReactDOM from 'react-dom'; // Импортируем ReactDOM для Portal
import { toast } from 'react-toastify'; // Для уведомлений из ChildForm
import { addChild, getAllChildren, getExpenseCategories, updateChild as updateChildAPI, type Child, type ExpenseCategory, type Task } from '../services/api'; // Импортируем функции API, addChild, updateChild as updateChildAPI
import ChildForm from './ChildForm'; // Импорт ChildForm
import './TaskForm.css';
import UnifiedChildSelector from './UnifiedChildSelector'; // Импорт нового компонента

interface TaskFormProps {
  initialData?: Partial<Task> & { formType: 'income' | 'expense' }; // Используем formType для внутренней логики формы
  onTaskSaved: (taskData: Omit<Task, 'id'> | Task) => void; // Обновляем тип для передачи данных задачи
  onClose: () => void;
  onDelete?: (id: string) => void; // Упрощаем onDelete, itemType не нужен, т.к. удаляем всегда Task
  onDuplicate?: (id: string) => void; // Упрощаем onDuplicate
}

const TaskForm: React.FC<TaskFormProps> = ({ initialData, onTaskSaved, onClose, onDelete, onDuplicate }) => {
  const [formData, setFormData] = useState(() => {
    const defaultDueDate = initialData?.dueDate || new Date().toISOString().split('T')[0];
    const baseData = {
      id: initialData?.id, // Используем id вместо uuid
      // `type` будет определяться на основе `formType` и других полей перед сохранением
      title: initialData?.title || '',
      description: initialData?.description || '',
      time: initialData?.time || '',
      address: initialData?.address || '',
      child_id: initialData?.child_id || null, // Используем child_id
      hourlyRate: initialData?.hourlyRate || undefined, // Может быть undefined если не почасовая
      comments: initialData?.comments || '',
      expenseCategoryName: initialData?.expenseCategoryName || '',
      amount: initialData?.amount || undefined, // Общее поле amount
      hoursWorked: initialData?.hoursWorked || undefined, // Может быть undefined
      dueDate: defaultDueDate,
      completed: initialData?.completed || false,
      isPaid: initialData?.isPaid || false,
      // Внутреннее состояние формы для определения доход/расход
      formType: initialData?.formType || 'income',
      // Для связи с API, если это существующая задача
      category_id: initialData?.category_id,
      // Для отображения имени ребенка, если есть
      child_name: initialData?.child_name,
      // Оригинальный `type` задачи, если редактируем, чтобы не потерять его
      originalTaskType: initialData?.type
    };
    return baseData;
  });

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildUuid, setSelectedChildUuid] = useState<string | null>(initialData?.child_id || null);
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
      setFormData(prevData => ({
        ...prevData,
        id: initialData.id,
        formType: initialData.formType || prevData.formType,
        title: initialData.title ?? prevData.title,
        description: initialData.description || prevData.description,
        time: initialData.time || prevData.time,
        address: initialData.address || prevData.address,
        child_id: initialData.child_id || prevData.child_id,
        hourlyRate: initialData.hourlyRate ?? prevData.hourlyRate,
        comments: initialData.comments || prevData.comments,
        expenseCategoryName: initialData.expenseCategoryName || prevData.expenseCategoryName,
        amount: initialData.amount ?? prevData.amount,
        hoursWorked: initialData.hoursWorked ?? prevData.hoursWorked,
        dueDate: initialData.dueDate ?? prevData.dueDate,
        completed: initialData.completed ?? prevData.completed,
        isPaid: initialData.isPaid ?? prevData.isPaid,
        category_id: initialData.category_id || prevData.category_id,
        child_name: initialData.child_name || prevData.child_name,
        originalTaskType: initialData.type || prevData.originalTaskType,
      }));
      setSelectedChildUuid(initialData.child_id || null);
    }
  }, [initialData]);

  const [categories, setCategories] = useState<ExpenseCategory[]>([]); // Храним объекты категорий

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getExpenseCategories();
        setCategories(fetchedCategories); // Сохраняем объекты категорий
      } catch (error) {
        console.error('Ошибка при загрузке категорий:', error);
        toast.error('Ошибка при загрузке списка категорий.');
      }
    };
    fetchCategories();
    fetchChildrenCallback();
  }, [fetchChildrenCallback]);

  useEffect(() => {
    if (selectedChildUuid) {
      const childData = children.find(c => c.uuid === selectedChildUuid);
      if (childData) {
        setSelectedChildDetails(childData);
        setFormData((prevData) => ({
          ...prevData,
          child_id: childData.uuid,
          hourlyRate: childData.hourlyRate ?? prevData.hourlyRate, // Используем ставку ребенка или текущую в форме
          address: childData.address || prevData.address,
          // title: prevData.title || `Работа с ${childData.childName}`, // Автозаполнение, если title пуст
          child_name: childData.childName, // Для отображения
        }));
      } else {
        // Если ребенок не найден в списке (например, после удаления), сбрасываем
        setSelectedChildDetails(null);
        setFormData(prev => ({ ...prev, child_id: null, child_name: undefined }));
      }
    } else {
      setSelectedChildDetails(null);
      // Не сбрасываем title, если ребенок не выбран, пользователь мог ввести его вручную
      setFormData(prev => ({ ...prev, child_id: null, child_name: undefined, hourlyRate: initialData?.hourlyRate || undefined }));
    }
  }, [selectedChildUuid, children, initialData?.hourlyRate]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type: inputType } = e.target;

    if (name === "formType") {
        setFormData(prev => ({ ...prev, formType: value as 'income' | 'expense' }));
        return;
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: inputType === 'number'
        ? (value === '' ? undefined : parseFloat(value)) // Для числовых полей, если пусто, ставим undefined
        : value,
    }));
  };


  const handleUnifiedChildChange = (childUuid: string | null) => {
    setSelectedChildUuid(childUuid);
  };

  const handleOpenChildFormForNew = (childName?: string) => { // childName опционален
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

    // Определяем тип задачи для API
    let taskTypeForApi: string;
    if (formData.formType === 'expense') {
      taskTypeForApi = 'expense';
    } else {
      // Для 'income' формы, тип может быть 'hourly', 'fixed', или просто 'income'
      // Если есть часы или ставка, предполагаем 'hourly'
      // Иначе, если есть initialData.type (т.е. редактируем), используем его
      // Иначе, по умолчанию 'income' (или 'fixed', если это более подходящий дефолт)
      if (formData.hoursWorked || formData.hourlyRate) {
        taskTypeForApi = 'hourly';
      } else {
        taskTypeForApi = formData.originalTaskType || 'fixed'; // 'fixed' как более общий для дохода без часов
      }
    }

    const dataToSave: Omit<Task, 'id'> & { id?: string } = {
      id: formData.id, // id будет undefined для новых задач
      title: formData.title,
      description: formData.description,
      type: taskTypeForApi,
      time: formData.time || undefined,
      dueDate: formData.dueDate,
      completed: formData.completed,
      child_id: selectedChildUuid || undefined,
      child_name: selectedChildDetails?.childName || undefined, // Добавляем имя ребенка если выбран
      category_id: formData.formType === 'expense'
        ? categories.find(c => c.category_name === formData.expenseCategoryName)?.uuid
        : undefined,
      expenseCategoryName: formData.formType === 'expense' ? formData.expenseCategoryName : undefined,
      amount: formData.amount,
      hourlyRate: taskTypeForApi === 'hourly' ? formData.hourlyRate : undefined,
      hoursWorked: taskTypeForApi === 'hourly' ? formData.hoursWorked : undefined,
      isPaid: formData.isPaid,
      address: selectedChildDetails?.address || formData.address || undefined, // Адрес из ребенка или формы
      comments: formData.comments || undefined,
    };

    // Расчет amount для почасовых задач, если не указан явно
    if (taskTypeForApi === 'hourly' && dataToSave.hourlyRate && dataToSave.hoursWorked && dataToSave.amount === undefined) {
        dataToSave.amount = dataToSave.hourlyRate * dataToSave.hoursWorked;
    }


    onTaskSaved(dataToSave as Omit<Task, 'id'> | Task); // Передаем данные в DayDetailsPage
    // onClose(); // Закрытие формы теперь обрабатывается в DayDetailsPage после успешного сохранения
  };


  const handleDeleteClick = () => {
    if (formData.id && onDelete) {
      onDelete(formData.id);
      // onClose(); // Закрытие формы теперь обрабатывается в DayDetailsPage
    }
  };

  const handleDuplicateClick = () => {
    if (formData.id && onDuplicate) {
      onDuplicate(formData.id);
      // onClose(); // Закрытие формы теперь обрабатывается в DayDetailsPage
    }
  };


  const modalContent = (
    <>
      <div className="modal-overlay" onClick={onClose} data-testid="modal-overlay">
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-button" onClick={onClose}>&times;</button>
          <form className="form" onSubmit={handleSubmit}>
            <h2>{formData.id ? 'Редактировать задачу' : 'Создать новую задачу'}</h2>

            <div className="form-group">
              <label htmlFor="title" className="label">Название:</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="label">Описание (опционально):</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="textarea"
              />
            </div>


            <div className="form-group">
              <label htmlFor="formType" className="label">Тип операции:</label>
              <select
                id="formType"
                name="formType"
                value={formData.formType}
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
              <label htmlFor="time" className="label">Время (опционально):</label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="input"
              />
            </div>

            {formData.formType === 'income' && (
              <>
                <UnifiedChildSelector
                  value={selectedChildUuid}
                  onChange={handleUnifiedChildChange}
                  childrenList={children}
                  onAddNewChildRequest={() => handleOpenChildFormForNew(undefined)} // Передаем undefined, если имя не введено
                  onGoToCreateChildPageRequest={handleOpenChildFormDefault}
                  label="Ребенок (опционально):"
                  placeholder="Выберите или добавьте ребенка"
                  selectedChildDetails={selectedChildDetails}
                />
                 {selectedChildDetails && selectedChildDetails.hourlyRate && !formData.hourlyRate && (
                  <div className="info-text">Ставка ребенка: {selectedChildDetails.hourlyRate}</div>
                )}
                <div className="form-group">
                  <label htmlFor="hourlyRate" className="label">Ставка в час (если применимо):</label>
                  <input
                    type="number"
                    id="hourlyRate"
                    name="hourlyRate"
                    value={formData.hourlyRate ?? ''}
                    onChange={handleChange}
                    className="input"
                    placeholder={selectedChildDetails?.hourlyRate?.toString() || "0"}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="hoursWorked" className="label">Количество часов (если применимо):</label>
                  <input
                    type="number"
                    id="hoursWorked"
                    name="hoursWorked"
                    value={formData.hoursWorked ?? ''}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="amount" className="label">Сумма дохода (если не почасовая):</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount ?? ''}
                    onChange={handleChange}
                    className="input"
                    // Если есть часы и ставка, это поле может быть рассчитано автоматически
                    disabled={!!(formData.hourlyRate && formData.hoursWorked)}
                    placeholder={(formData.hourlyRate && formData.hoursWorked) ? (formData.hourlyRate * formData.hoursWorked).toString() : "0"}
                  />
                </div>
                 <div className="form-group">
                  <label htmlFor="isPaid" className="label">Оплачено:</label>
                  <input
                    type="checkbox"
                    id="isPaid"
                    name="isPaid"
                    checked={formData.isPaid}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPaid: e.target.checked }))}
                  />
                </div>
              </>
            )}

            {formData.formType === 'expense' && (
              <>
                <div className="form-group">
                  <label htmlFor="amount" className="label">Сумма расхода:</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount ?? ''}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                    placeholder="0"
                    className="input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="expenseCategoryName" className="label">Категория расхода:</label>
                  <select
                    id="expenseCategoryName"
                    name="expenseCategoryName"
                    value={formData.expenseCategoryName}
                    onChange={handleChange}
                    className="input"
                    required
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map((category) => (
                      <option key={category.uuid} value={category.category_name}>{category.category_name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="comments" className="label">Комментарий (опционально):</label>
              <textarea
                id="comments"
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                className="textarea"
              />
            </div>
             <div className="form-group">
                <label htmlFor="completed" className="label">Выполнено:</label>
                <input
                    type="checkbox"
                    id="completed"
                    name="completed"
                    checked={formData.completed}
                    onChange={(e) => setFormData(prev => ({ ...prev, completed: e.target.checked }))}
                />
            </div>


            <div className="form-actions">
              {formData.id && onDelete && (
                <button type="button" className="delete-button-form" onClick={handleDeleteClick}>
                  Удалить
                </button>
              )}
              {/* Дублирование пока убрано из основного потока, можно будет вернуть
              {formData.id && onDuplicate && (
                <button type="button" className="duplicate-button-form" onClick={handleDuplicateClick}>
                  Дублировать
                </button>
              )} */}
              <button type="submit" className="submit-button">
                {formData.id ? 'Сохранить изменения' : 'Создать задачу'}
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