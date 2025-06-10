import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import * as ReactDOM from 'react-dom';
import { toast } from 'react-toastify';
import { useTasks } from '../context/TaskContext';
import {
  addChild,
  getAllChildren,
  getAssignableUsers,
  getExpenseCategories,
  updateChild as updateChildAPI,
  type Child,
  type ExpenseCategory,
  type Task,
  type User
} from '../services/api';
import ChildForm from './ChildForm';
import UnifiedChildSelector from './UnifiedChildSelector';
import './UnifiedTaskFormModal.css';

interface UnifiedTaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Task | Omit<Task, 'uuid'>) => Promise<void>;
  mode: 'create' | 'edit';
  initialTaskData?: Task;
  initialTaskType?: 'income' | 'expense' | 'task';
  onDelete?: (uuid: string) => void;
  onDuplicate?: (uuid: string) => void;
  onTaskUpsert?: () => void;
}


function formatDateTimeForInput(isoDateTime: string | null | undefined): string {
 if (!isoDateTime) return '';
 try {
   const date = new Date(isoDateTime);
   // Проверяем, валидна ли дата
   if (isNaN(date.getTime())) {
     return '';
   }
   // Форматируем в 'YYYY-MM-DDTHH:MM'
   const year = date.getFullYear();
   const month = (date.getMonth() + 1).toString().padStart(2, '0');
   const day = date.getDate().toString().padStart(2, '0');
   const hours = date.getHours().toString().padStart(2, '0');
   const minutes = date.getMinutes().toString().padStart(2, '0');
   return `${year}-${month}-${day}T${hours}:${minutes}`;
 } catch (error) {
   console.error("Error formatting date-time:", error);
   return '';
 }
}

const UnifiedTaskFormModal = ({
  isOpen,
  onClose: originalOnClose,
  onSubmit,
  mode,
  initialTaskData,
  initialTaskType,
  onDelete,
  onTaskUpsert,
}: UnifiedTaskFormModalProps) => {
  const { refetchTasks } = useTasks();
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      originalOnClose();
      setIsClosing(false);
    }, 300);
  }, [originalOnClose]);

  const [taskTypeInternal, setTaskTypeInternal] = useState<'income' | 'expense' | 'task'>('income');

  const [formData, setFormData] = useState(() => {
    const defaultDueDate = initialTaskData?.dueDate || new Date().toISOString().split('T')[0];
    const baseData = {
      id: mode === 'edit' ? initialTaskData?.uuid : undefined,
      title: initialTaskData?.title || '',
      time: initialTaskData?.time || '',
      address: initialTaskData?.address || '',
      childId: initialTaskData?.childId || null,
      hourlyRate: initialTaskData?.hourlyRate || undefined,
      comments: initialTaskData?.comments || '',
      expenseCategoryName: initialTaskData?.expenseCategoryName || '',
      amount: initialTaskData?.amount || undefined,
      hoursWorked: initialTaskData?.hoursWorked || undefined,
      dueDate: defaultDueDate,
      expense_category_uuid: initialTaskData?.expense_category_uuid,
      childName: initialTaskData?.childName,
      originalTaskType: initialTaskData?.type,
      reminder_at: formatDateTimeForInput(initialTaskData?.reminder_at),
      reminder_offset: initialTaskData?.reminder_offset ?? null,
      assigned_to_id: initialTaskData?.assigned_to_id ?? null,
    };
    return baseData;
  });


  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildUuid, setSelectedChildUuid] = useState<string | null>(initialTaskData?.childId || null);
  const [selectedChildDetails, setSelectedChildDetails] = useState<Child | null>(null);

  const [showChildFormModal, setShowChildFormModal] = useState(false);
  const [childFormInitialData, setChildFormInitialData] = useState<Partial<Child> | undefined>(undefined);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);


  const fetchChildrenCallback = useCallback(async () => {
    try {
      const fetchedChildren = await getAllChildren();
      setChildren(fetchedChildren);
    } catch (error) {
      // Ошибка при загрузке детей
      toast.error('Ошибка при загрузке списка детей.');
    }
  }, []);

  useEffect(() => {
    const defaultDueDate = new Date().toISOString().split('T')[0];

    // Determine task type
    let newType: 'income' | 'expense' | 'task' = initialTaskType || 'income';
    if (mode === 'edit' && initialTaskData) {
        if (initialTaskData.type === 'expense') newType = 'expense';
        else if (initialTaskData.type === 'task') newType = 'task';
        else if (['income', 'hourly', 'fixed'].includes(initialTaskData.type)) newType = 'income';
    }
    setTaskTypeInternal(newType);

    // Initialize form data
    let newFormData = {
        id: initialTaskData?.uuid,
        title: initialTaskData?.title || '',
        dueDate: initialTaskData?.dueDate || defaultDueDate,
        time: initialTaskData?.time || '',
        address: initialTaskData?.address || '',
        comments: initialTaskData?.comments || '',
        reminder_at: formatDateTimeForInput(initialTaskData?.reminder_at),
        reminder_offset: initialTaskData?.reminder_offset ?? null,
        assigned_to_id: initialTaskData?.user_uuid || initialTaskData?.assigned_to_id || null,
        childId: initialTaskData?.child_uuid || initialTaskData?.childId || null,
        hourlyRate: initialTaskData?.hourlyRate,
        hoursWorked: initialTaskData?.hoursWorked,
        amount: initialTaskData?.amount,
        expense_category_uuid: initialTaskData?.expense_category_uuid,
        expenseCategoryName: initialTaskData?.expenseCategoryName || '',
        childName: initialTaskData?.childName,
        originalTaskType: initialTaskData?.type,
    };

    // Clean up fields based on the determined type
    if (newType === 'expense') {
        newFormData.childId = null;
        newFormData.childName = undefined;
        newFormData.hourlyRate = undefined;
        newFormData.hoursWorked = undefined;
        newFormData.time = '';
    } else if (newType === 'income') {
        newFormData.expense_category_uuid = undefined;
        newFormData.expenseCategoryName = '';
        newFormData.assigned_to_id = null;
        newFormData.reminder_offset = null;
    } else if (newType === 'task') {
        newFormData.expense_category_uuid = undefined;
        newFormData.expenseCategoryName = '';
        newFormData.childId = null;
        newFormData.childName = undefined;
        newFormData.hourlyRate = undefined;
        newFormData.hoursWorked = undefined;
        newFormData.time = '';
        newFormData.amount = undefined;
    }

    // Reset for create mode
    if (mode === 'create') {
        newFormData = {
            id: undefined,
            title: '',
            time: '',
            address: '',
            childId: null,
            hourlyRate: undefined,
            comments: '',
            expenseCategoryName: '',
            amount: undefined,
            hoursWorked: undefined,
            dueDate: initialTaskData?.dueDate || defaultDueDate,
            expense_category_uuid: undefined,
            childName: undefined,
            originalTaskType: undefined,
            reminder_at: '',
            reminder_offset: null,
            assigned_to_id: null,
        };
        setSelectedChildUuid(null);
    } else { // edit mode specific updates
        const childIdToSetForSelector = initialTaskData?.child_uuid || initialTaskData?.childId || null;
        setSelectedChildUuid(childIdToSetForSelector);
    }

    setFormData(newFormData);

}, [mode, initialTaskData, initialTaskType]);


      const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getExpenseCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        // Ошибка при загрузке категорий
        toast.error('Ошибка при загрузке списка категорий.');
      }
    };
    fetchCategories();
    fetchChildrenCallback();

    const fetchAssignableUsers = async () => {
      try {
        const users = await getAssignableUsers();
        setAssignableUsers(users);
      } catch (error) {
        toast.error('Ошибка при загрузке списка пользователей.');
      }
    };
    fetchAssignableUsers();
  }, [fetchChildrenCallback]);

  useEffect(() => {
    if (selectedChildUuid) {
      const childData = children.find(c => c.uuid === selectedChildUuid);
      if (childData) {
        setSelectedChildDetails(childData);
        setFormData((prevData) => {
          const updatedData = {
            ...prevData,
            childId: childData.uuid,
            hourlyRate: childData.hourlyRate ?? prevData.hourlyRate,
            address: childData.address || prevData.address,
            childName: childData.childName,
          };
          return updatedData;
        });
      } else if (children.length > 0 || (mode === 'create' && !initialTaskData?.childId) || (mode === 'edit' && initialTaskData && selectedChildUuid !== initialTaskData.childId)) {
        setSelectedChildDetails(null);
        if (!initialTaskData?.childId || selectedChildUuid !== initialTaskData.childId) { // Оставляем childId здесь, так как он из initialTaskData
          setFormData(prev => {
            const resetData = {
              ...prev,
                childId: null,
                childName: undefined,
              };
              return resetData;
            });
        }
      } else {
      }
    } else {
      setSelectedChildDetails(null);
      setFormData(prev => {
        const resetData = {
          ...prev,
          childId: null,
          childName: undefined,
          hourlyRate: initialTaskData?.hourlyRate || undefined
        };
        return resetData;
      });
    }
  }, [selectedChildUuid, children, initialTaskData, mode]);

  useEffect(() => {
    if (
      taskTypeInternal === 'income' &&
      typeof formData.hourlyRate === 'number' && formData.hourlyRate > 0 && // hourlyRate может быть скрыто, но логика расчета остается
      typeof formData.hoursWorked === 'number' && formData.hoursWorked > 0
    ) {
      setFormData(prevData => ({
        ...prevData,
        amount: prevData.hourlyRate! * prevData.hoursWorked!,
      }));
    }
  }, [formData.hourlyRate, formData.hoursWorked, taskTypeInternal]);



  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type: inputType } = e.target;

    setFormData((prevData) => {
      const newValue = inputType === 'number'
        ? (value === '' ? undefined : parseFloat(value))
        : value;
      const newFormData = {
        ...prevData,
        [name]: newValue,
      };
      if (name === 'dueDate') {
      }
      return newFormData;
    });
  };

  const handleUnifiedChildChange = (childUuid: string | null) => {
    setSelectedChildUuid(childUuid);
  };

  const handleOpenChildFormForNew = (childName?: string) => {
    setChildFormInitialData({ childName });
    setShowChildFormModal(true);
  };

  const handleOpenChildFormDefault = () => {
    setChildFormInitialData({});
    setShowChildFormModal(true);
  };

  const handleChildFormSave = async (childDataFromForm: Child | Partial<Child>) => {
    try {
      let savedOrUpdatedChild: Child;
      if (childDataFromForm.uuid) {
        savedOrUpdatedChild = await updateChildAPI(childDataFromForm.uuid, childDataFromForm as Child);
        toast.success('Карточка ребенка успешно обновлена!');
      } else {
        const { uuid, ...dataToSend } = childDataFromForm;
        savedOrUpdatedChild = await addChild(dataToSend as Omit<Child, 'uuid'>);
        toast.success('Новая карточка ребенка успешно добавлена!');
      }
      setShowChildFormModal(false);
      await fetchChildrenCallback();
      setSelectedChildUuid(savedOrUpdatedChild.uuid);
    } catch (error) {
      toast.error('Ошибка при сохранении карточки ребенка.');
      // Ошибка при сохранении карточки ребенка из TaskForm
    }
  };

  const handleChildFormCancel = () => {
    setShowChildFormModal(false);
    setChildFormInitialData(undefined);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const childNameForTitle = selectedChildUuid ? children.find(c => c.uuid === selectedChildUuid)?.childName : undefined;

    let taskTypeForApi: 'income' | 'expense' | 'task' | 'hourly' | 'fixed';
    if (taskTypeInternal === 'expense') {
      taskTypeForApi = 'expense';
    } else if (taskTypeInternal === 'task') {
      taskTypeForApi = 'task';
    } else { // income
      if (formData.hoursWorked && formData.hourlyRate) {
        taskTypeForApi = 'hourly';
      } else {
        taskTypeForApi = 'fixed';
      }
    }

    const reminderAtUTC = formData.reminder_at
    ? new Date(formData.reminder_at).toISOString()
    : null;

    const dataToSave: Omit<Task, 'uuid'> & { uuid?: string } = {
      uuid: mode === 'edit' ? initialTaskData?.uuid : undefined,
      title: formData.title,
      type: taskTypeForApi,
      time: taskTypeInternal === 'income' ? (formData.time || undefined) : undefined, // Время только для дохода
      dueDate: formData.dueDate,
      childId: taskTypeInternal === 'income' ? (selectedChildUuid || undefined) : undefined,
      childName: taskTypeInternal === 'income' ? (childNameForTitle || undefined) : undefined,
      expense_category_uuid: taskTypeInternal === 'expense'
        ? categories.find(c => c.categoryName === formData.expenseCategoryName)?.uuid
        : undefined,
      amount: (taskTypeInternal === 'income' || taskTypeInternal === 'expense') ? formData.amount : undefined,
      hourlyRate: taskTypeInternal === 'income' && (taskTypeForApi === 'hourly' || taskTypeForApi === 'fixed') ? formData.hourlyRate : undefined,
      hoursWorked: taskTypeInternal === 'income' && (taskTypeForApi === 'hourly' || taskTypeForApi === 'fixed') ? formData.hoursWorked : undefined,
      comments: formData.comments || undefined,
      reminder_at: reminderAtUTC,
      assigned_to_id: taskTypeInternal === 'task' ? formData.assigned_to_id : null,
      reminder_offset: taskTypeInternal === 'task' ? formData.reminder_offset : null,
      assignee_username: undefined, // We are sending assigned_to_id now
    };

    if (taskTypeForApi === 'hourly' && dataToSave.hourlyRate && dataToSave.hoursWorked && dataToSave.amount === undefined) {
        dataToSave.amount = dataToSave.hourlyRate * dataToSave.hoursWorked;
    }

    try {
      await onSubmit(dataToSave as Task | Omit<Task, 'uuid'>);
      if (onTaskUpsert) {
        refetchTasks();
        if (onTaskUpsert) {
          onTaskUpsert();
        }
      }
    } catch (error) {
      toast.error("Произошла ошибка при сохранении задачи.");
    }
  };

  const handleDeleteClick = () => {
    if (mode === 'edit' && initialTaskData?.uuid && onDelete) {
      onDelete(initialTaskData.uuid);
      refetchTasks();
    }
  };

  if (!isOpen && !isClosing) {
    return null;
  }

  const modalOverlayClass = `modal-overlay ${isClosing ? 'closing' : ''}`;
  const modalContentClass = `modal-content ${isClosing ? 'closing' : ''}`;

  const modalContent = (
    <>
      <div className={modalOverlayClass} onClick={handleClose} data-testid="modal-overlay">
        <div className={modalContentClass} onClick={(e) => e.stopPropagation()}>
          <button className="btn btn-icon close-button" onClick={handleClose}>&times;</button>
          <form className="form" onSubmit={handleSubmit}>
            <h2>{mode === 'edit' ? 'Редактирование дела' : 'Создание дела'}</h2>

            <div className="form-group">
              <label className="label">Тип:</label>
              <select
                name="taskType"
                value={taskTypeInternal}
                onChange={(e) => setTaskTypeInternal(e.target.value as 'income' | 'expense' | 'task')}
                className="input"
              >
                <option value="income">Доход</option>
                <option value="expense">Расход</option>
                <option value="task">Задача</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="title" className="label">Название:</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dueDate" className="label">Дата:</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reminder_at" className="label">Напомнить в:</label>
              <input
                type="datetime-local"
                id="reminder_at"
                name="reminder_at"
                value={formData.reminder_at || ''}
                onChange={handleChange}
                className="input"
              />
            </div>

            {taskTypeInternal === 'task' && (
              <>
                <div className="form-group">
                  <label htmlFor="assigned_to_id" className="label">Кому:</label>
                  <select
                    id="assigned_to_id"
                    name="assigned_to_id"
                    value={formData.assigned_to_id || ''}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Не назначено</option>
                    {assignableUsers.map(user => (
                      <option key={user.uuid} value={user.uuid}>{user.username}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="reminder_offset" className="label">Напомнить за:</label>
                  <select
                    id="reminder_offset"
                    name="reminder_offset"
                    value={formData.reminder_offset || ''}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Не напоминать</option>
                    <option value="900">15 минут</option>
                    <option value="1800">30 минут</option>
                    <option value="3600">1 час</option>
                    <option value="86400">1 день</option>
                  </select>
                </div>
              </>
            )}

            {(taskTypeInternal === 'income' || taskTypeInternal === 'expense') && (
              <div className="form-group">
                <label htmlFor="amount" className="label">Сумма:</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount ?? ''}
                  onChange={handleChange}
                  className="input"
                  placeholder="0"
                  required
                  disabled={
                    taskTypeInternal === 'income' &&
                    typeof formData.hourlyRate === 'number' && formData.hourlyRate > 0 &&
                    typeof formData.hoursWorked === 'number' && formData.hoursWorked > 0
                  }
                />
              </div>
            )}

            {taskTypeInternal === 'income' && (
              <>
                <UnifiedChildSelector
                  value={selectedChildUuid}
                  onChange={handleUnifiedChildChange}
                  childrenList={children}
                  onAddNewChildRequest={() => handleOpenChildFormForNew(undefined)}
                  onGoToCreateChildPageRequest={handleOpenChildFormDefault}
                  label="Имя ребенка:"
                  placeholder="Выберите или добавьте ребенка"
                  selectedChildDetails={selectedChildDetails}
                  className="input"
                />
                <div className="form-group">
                  <label htmlFor="time" className="label">Время:</label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
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
                    className="input"
                    placeholder="0"
                  />
                </div>
              </>
            )}

            {taskTypeInternal === 'expense' && (
              <div className="form-group">
                <label htmlFor="expenseCategoryName" className="label">Категория:</label>
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
                    <option key={category.uuid} value={category.categoryName}>{category.categoryName}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="comments" className="label">Комментарий:</label>
              <textarea
                id="comments"
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                className="textarea"
              />
            </div>

            <div className="form-actions">
              {mode === 'edit' && onDelete && initialTaskData?.uuid && (
                <button type="button" className="btn btn-secondary delete-button-form" onClick={handleDeleteClick}>
                  Удалить
                </button>
              )}
              {!(mode === 'edit' && onDelete && initialTaskData?.uuid) && <div style={{ flexBasis: 'calc(50% - 5px)' }}></div>}

              <button type="submit" className="btn btn-primary submit-button">
                {mode === 'edit' ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {showChildFormModal && (
        <div className={`modal-overlay ${isClosing && !showChildFormModal ? 'closing' : ''}`} onClick={handleChildFormCancel} data-testid="child-form-modal-overlay">
          <div className={`modal-content ${isClosing && !showChildFormModal ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-icon close-button" onClick={handleChildFormCancel}>&times;</button>
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
    // Элемент с id 'modal-root' не найден в DOM.
    return null;
  }
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default UnifiedTaskFormModal;