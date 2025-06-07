import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import * as ReactDOM from 'react-dom';
import { toast } from 'react-toastify';
import { useTasks } from '../context/TaskContext';
import { addChild, getAllChildren, getExpenseCategories, updateChild as updateChildAPI, type Child, type ExpenseCategory, type Task } from '../services/api';
import ChildForm from './ChildForm';
import UnifiedChildSelector from './UnifiedChildSelector';
import './UnifiedTaskFormModal.css';

interface UnifiedTaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Task | Omit<Task, 'uuid'>) => Promise<void>;
  mode: 'create' | 'edit';
  initialTaskData?: Task;
  initialTaskType?: 'income' | 'expense';
  onDelete?: (uuid: string) => void;
  onDuplicate?: (uuid: string) => void;
  onTaskUpsert?: () => void;
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

  const [taskTypeInternal, setTaskTypeInternal] = useState<'income' | 'expense'>(() => {
    if (mode === 'edit' && initialTaskData?.type) {
      if (initialTaskType) return initialTaskType;
      return initialTaskData.type === 'expense' ? 'expense' : 'income';
    }
    return initialTaskType || 'income';
  });

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
      expenseTypeId: initialTaskData?.expenseTypeId,
      childName: initialTaskData?.childName,
      originalTaskType: initialTaskData?.type,
      reminder_at: initialTaskData?.reminder_at || '',
    };
    return baseData;
  });


  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildUuid, setSelectedChildUuid] = useState<string | null>(initialTaskData?.childId || null);
  const [selectedChildDetails, setSelectedChildDetails] = useState<Child | null>(null);

  const [showChildFormModal, setShowChildFormModal] = useState(false);
  const [childFormInitialData, setChildFormInitialData] = useState<Partial<Child> | undefined>(undefined);

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
    if (mode === 'edit' && initialTaskData) {
      const determinedTaskType = initialTaskType || (initialTaskData.type === 'expense' ? 'expense' : 'income');
      setTaskTypeInternal(determinedTaskType);

      const taskAmount = initialTaskData.amount ?? (determinedTaskType === 'income' ? initialTaskData.amountEarned : initialTaskData.amountSpent) ?? undefined;

      const newFormData = {
        id: initialTaskData.uuid,
        title: initialTaskData.title ?? '',
        time: initialTaskData.time || '',
        address: initialTaskData.address || '',
        childId: initialTaskData.childId || null,
        hourlyRate: initialTaskData.hourlyRate ?? undefined,
        comments: initialTaskData.comments || '',
        expenseCategoryName: initialTaskData.expenseCategoryName || '',
        amount: taskAmount,
        hoursWorked: initialTaskData.hoursWorked ?? undefined,
        dueDate: initialTaskData.dueDate ?? new Date().toISOString().split('T')[0],
        expenseTypeId: initialTaskData.expenseTypeId,
        childName: initialTaskData.childName,
        originalTaskType: initialTaskData.type,
        reminder_at: initialTaskData.reminder_at || '',
      };
      setFormData(newFormData);


      const childIdToSetForSelector = initialTaskData.childId || null;
      setSelectedChildUuid(childIdToSetForSelector);
    } else if (mode === 'create') {
      setTaskTypeInternal(initialTaskType || 'income');
      setFormData(prev => {
        const newFormData = {
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
        dueDate: prev.dueDate,
        expenseTypeId: undefined,
        childName: undefined,
        originalTaskType: undefined,
        reminder_at: '',
      };
        return newFormData;
    });
      setSelectedChildUuid(null);
    }
  }, [mode, initialTaskData, initialTaskType]); // initialTaskType добавлен, чтобы isNameManuallyEdited правильно сбрасывалось/устанавливалось при его изменении

  useEffect(() => {
    setFormData(prev => {
      const newFormData = { ...prev };

      const initialAmount = initialTaskData?.amount;
      const initialAmountEarned = initialTaskData?.amountEarned;
      const initialAmountSpent = initialTaskData?.amountSpent;

      const preserveAmountFromInitial =
        mode === 'edit' &&
        initialTaskData &&
        (initialAmount !== undefined || initialAmountEarned !== undefined || initialAmountSpent !== undefined) &&
        initialTaskData.type &&
        (
          ((initialTaskData.type === 'income' || initialTaskData.type === 'hourly' || initialTaskData.type === 'fixed') && taskTypeInternal === 'income') ||
          (initialTaskData.type === 'expense' && taskTypeInternal === 'expense')
        );


      if (taskTypeInternal === 'expense') {
        newFormData.childId = null;
        newFormData.childName = undefined;
        newFormData.hourlyRate = undefined;
        newFormData.hoursWorked = undefined;
        newFormData.time = '';
      } else if (taskTypeInternal === 'income') {
        newFormData.expenseTypeId = undefined;
        newFormData.expenseCategoryName = '';
      }

      if (preserveAmountFromInitial) {
        // Если тип задачи совпадает с исходным и сумма была, пытаемся ее сохранить
        // Приоритет: initialTaskData.amount, затем amountEarned/amountSpent в зависимости от ТЕКУЩЕГО taskTypeInternal
        if (initialAmount !== undefined) {
          newFormData.amount = initialAmount;
        } else if (taskTypeInternal === 'income' && initialAmountEarned !== undefined) {
          newFormData.amount = initialAmountEarned;
        } else if (taskTypeInternal === 'expense' && initialAmountSpent !== undefined) {
          newFormData.amount = initialAmountSpent;
        }
        // Если initialAmount был, но типы не совпали, amount уже мог быть сброшен первым useEffect,
        // или будет сброшен ниже, если не авто-расчет.
      } else {
        // Если не сохраняем из initial (например, тип задачи сменился или это создание новой)
        const isAutoCalculated = taskTypeInternal === 'income' &&
                                 typeof newFormData.hourlyRate === 'number' && newFormData.hourlyRate > 0 &&
                                 typeof newFormData.hoursWorked === 'number' && newFormData.hoursWorked > 0;
       if (!isAutoCalculated) {
            newFormData.amount = undefined;
       } else {
           }
         }
         return newFormData;
       });
     }, [taskTypeInternal, mode, initialTaskData]);


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

    let taskTypeForApi: string;
    if (taskTypeInternal === 'expense') {
      taskTypeForApi = 'expense';
    } else {
      // hourlyRate может быть невидимым, но если оно есть и часы есть, то тип hourly
      if (formData.hoursWorked && formData.hourlyRate) {
        taskTypeForApi = 'hourly';
      } else {
        taskTypeForApi = (mode === 'edit' && initialTaskData?.type && initialTaskData.type !== 'income' && initialTaskData.type !== 'expense')
          ? initialTaskData.type
          : 'fixed';
      }
    }

    const dataToSave: Omit<Task, 'uuid'> & { uuid?: string } = {
      uuid: mode === 'edit' ? initialTaskData?.uuid : undefined,
      title: formData.title,
      type: taskTypeForApi,
      time: taskTypeInternal === 'income' ? (formData.time || undefined) : undefined, // Время только для дохода
      dueDate: formData.dueDate, // Дата остается, хоть и невидима
      childId: taskTypeInternal === 'income' ? (selectedChildUuid || undefined) : undefined,
      childName: taskTypeInternal === 'income' ? (childNameForTitle || undefined) : undefined,
      expenseTypeId: taskTypeInternal === 'expense'
        ? categories.find(c => c.categoryName === formData.expenseCategoryName)?.uuid
        : undefined,
      expenseCategoryName: taskTypeInternal === 'expense' ? formData.expenseCategoryName : undefined,
      amount: formData.amount,
      hourlyRate: taskTypeInternal === 'income' && taskTypeForApi === 'hourly' ? formData.hourlyRate : undefined,
      hoursWorked: taskTypeInternal === 'income' && taskTypeForApi === 'hourly' ? formData.hoursWorked : undefined,
      comments: formData.comments || undefined,
      taskType: taskTypeInternal,
      reminder_at: formData.reminder_at || null,
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
              <label htmlFor="title" className="label">Название:</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="label">Тип задачи:</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="taskTypeInternal"
                    value="income"
                    checked={taskTypeInternal === 'income'}
                    onChange={() => setTaskTypeInternal('income')}
                  />
                  Доход
                </label>
                <label>
                  <input
                    type="radio"
                    name="taskTypeInternal"
                    value="expense"
                    checked={taskTypeInternal === 'expense'}
                    onChange={() => setTaskTypeInternal('expense')}
                  />
                  Расход
                </label>
              </div>
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
                 {selectedChildDetails && selectedChildDetails.hourlyRate && !formData.hourlyRate && (
                  <div className="info-text">Ставка ребенка: {selectedChildDetails.hourlyRate}</div>
                )}
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
                <div className="form-group">
                  <label htmlFor="amount" className="label">Заработано:</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount ?? ''}
                    onChange={handleChange}
                    className="input"
                    placeholder="0"
                    disabled={
                      taskTypeInternal === 'income' &&
                      typeof formData.hourlyRate === 'number' && formData.hourlyRate > 0 &&
                      typeof formData.hoursWorked === 'number' && formData.hoursWorked > 0
                    }
                  />
                </div>
              </>
            )}

            {taskTypeInternal === 'expense' && (
              <>
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
                <div className="form-group">
                  <label htmlFor="amount" className="label">Потрачено:</label>
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
              </>
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