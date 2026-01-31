import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import * as ReactDOM from 'react-dom';
import { toast } from 'react-toastify';
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
   if (isNaN(date.getTime())) {
     return '';
   }
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

const inputClass = 'w-full min-w-0 max-w-full rounded-xl border border-border-subtle bg-surface-elevated text-text-primary py-2.5 px-3 text-sm transition-all duration-[160ms] box-border focus-visible:outline-none focus-visible:border-[rgba(72,187,120,0.6)] focus-visible:shadow-[0_0_0_3px_rgba(72,187,120,0.16)]';
const labelClass = 'text-sm font-medium text-text-primary leading-tight';

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
  const [isClosing, setIsClosing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      originalOnClose();
      setIsClosing(false);
      setDragY(0);
    }, 300);
  }, [originalOnClose]);

  const handleDragStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = modalContentRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touchRelY = touch.clientY - rect.top;
    if (touchRelY > 60) return;
    dragStartY.current = touch.clientY;
    setIsDragging(true);
  }, []);

  const handleDragMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) setDragY(delta);
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragY > 100) {
      handleClose();
    } else {
      setDragY(0);
    }
  }, [isDragging, dragY, handleClose]);

  const [taskTypeInternal, setTaskTypeInternal] = useState<'income' | 'expense' | 'task' | 'lesson'>('income');

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
      toast.error('Ошибка при загрузке списка детей.');
    }
  }, []);

  useEffect(() => {
    const defaultDueDate = new Date().toISOString().split('T')[0];

    let newType: 'income' | 'expense' | 'task' | 'lesson' = initialTaskType || 'income';
    if (mode === 'edit' && initialTaskData) {
        if (initialTaskData.type === 'expense') newType = 'expense';
        else if (initialTaskData.type === 'task') newType = 'task';
        else if (initialTaskData.type === 'lesson') newType = 'lesson';
        else if (['income', 'hourly', 'fixed'].includes(initialTaskData.type)) newType = 'income';
    }
    setTaskTypeInternal(newType);

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
        newFormData.amount = undefined;
    } else if (newType === 'lesson') {
        newFormData.expense_category_uuid = undefined;
        newFormData.expenseCategoryName = '';
        newFormData.childId = null;
        newFormData.childName = undefined;
        newFormData.hourlyRate = undefined;
        newFormData.hoursWorked = undefined;
        newFormData.amount = undefined;
        newFormData.assigned_to_id = null;
        newFormData.reminder_offset = null;
    }

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
    } else {
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
        if (!initialTaskData?.childId || selectedChildUuid !== initialTaskData.childId) {
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
      typeof formData.hourlyRate === 'number' && formData.hourlyRate > 0 &&
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
    }
  };

  const handleChildFormCancel = () => {
    setShowChildFormModal(false);
    setChildFormInitialData(undefined);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const childNameForTitle = selectedChildUuid ? children.find(c => c.uuid === selectedChildUuid)?.childName : undefined;

    let taskTypeForApi: 'income' | 'expense' | 'task' | 'hourly' | 'fixed' | 'lesson';
    if (taskTypeInternal === 'expense') {
      taskTypeForApi = 'expense';
    } else if (taskTypeInternal === 'task') {
      taskTypeForApi = 'task';
    } else if (taskTypeInternal === 'lesson') {
      taskTypeForApi = 'lesson';
    } else {
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
      time: (taskTypeInternal === 'income' || taskTypeInternal === 'task' || taskTypeInternal === 'lesson') ? (formData.time || undefined) : undefined,
      dueDate: formData.dueDate,
      address: taskTypeInternal === 'lesson' ? (formData.address || undefined) : undefined,
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
      assignee_username: undefined,
    };

    if (taskTypeForApi === 'hourly' && dataToSave.hourlyRate && dataToSave.hoursWorked && dataToSave.amount === undefined) {
        dataToSave.amount = dataToSave.hourlyRate * dataToSave.hoursWorked;
    }

    try {
      await onSubmit(dataToSave as Task | Omit<Task, 'uuid'>);
      if (onTaskUpsert) {
        onTaskUpsert();
      }
    } catch (error) {
      toast.error("Произошла ошибка при сохранении задачи.");
    }
  };

  const handleDeleteClick = () => {
    if (mode === 'edit' && initialTaskData?.uuid && onDelete) {
      if (!confirmingDelete) {
        setConfirmingDelete(true);
        confirmTimerRef.current = setTimeout(() => setConfirmingDelete(false), 3000);
      } else {
        if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
        setConfirmingDelete(false);
        onDelete(initialTaskData.uuid);
      }
    }
  };

  if (!isOpen && !isClosing) {
    return null;
  }

  const isAmountDisabled =
    taskTypeInternal === 'income' &&
    typeof formData.hourlyRate === 'number' && formData.hourlyRate > 0 &&
    typeof formData.hoursWorked === 'number' && formData.hoursWorked > 0;

  const isAmountRequired = (taskTypeInternal === 'income' || taskTypeInternal === 'expense') && !isAmountDisabled;

  const overlayClass = clsx(
    'fixed inset-0 p-[clamp(12px,4vh,28px)_clamp(12px,4vw,24px)] bg-modal-overlay flex items-end justify-center z-[1050] font-[Inter,sans-serif]',
    isClosing ? 'animate-fade-out' : 'animate-fade-in',
    'min-[768px]:items-center',
  );

  const contentClass = clsx(
    'w-[min(480px,100%)] max-h-[calc(100dvh-40px)] bg-modal-content rounded-[20px_20px_16px_16px] shadow-elevation-3 relative flex flex-col p-4 overflow-hidden',
    isClosing ? 'animate-scale-down' : 'animate-scale-up',
    isDragging && '!transition-none',
    'min-[768px]:rounded-3xl min-[768px]:max-h-[min(90vh,720px)]',
  );

  const modalContent = (
    <>
      <div className={overlayClass} onClick={handleClose} data-testid="modal-overlay">
        <div
          ref={modalContentRef}
          className={contentClass}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          style={dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
        >
          <div className="w-10 h-1 rounded-sm bg-white/20 mx-auto mb-2 shrink-0" />
          <button
            type="button"
            className="absolute top-4 right-4 size-11 rounded-xl border border-white/[0.06] bg-white/[0.04] text-text-secondary text-xl leading-none inline-flex items-center justify-center transition-all duration-[160ms] hover:rotate-[-90deg] hover:border-white/[0.12] hover:bg-white/[0.08]"
            onClick={handleClose}
            aria-label="Закрыть"
          >
            &times;
          </button>
          <form className="mt-[var(--spacing-md)] flex flex-col gap-[var(--spacing-sm)] overflow-y-auto pr-1 flex-1 min-h-0 scrollbar-thin" onSubmit={handleSubmit}>
            <h2 className="m-0 pr-12 text-lg font-semibold text-text-primary leading-tight">{mode === 'edit' ? 'Редактирование дела' : 'Создание дела'}</h2>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Тип:</label>
              <select
                name="taskType"
                value={taskTypeInternal}
                onChange={(e) => setTaskTypeInternal(e.target.value as 'income' | 'expense' | 'task' | 'lesson')}
                className={inputClass}
              >
                <option value="income">Доход</option>
                <option value="expense">Расход</option>
                <option value="task">Задача</option>
                <option value="lesson">Занятие</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className={labelClass}>Название<span className="text-[rgba(224,86,86,0.92)] ml-1" aria-hidden="true">*</span>:</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex gap-3 min-w-0">
                <div className="flex-1 min-w-0">
                  <label htmlFor="dueDate" className={labelClass}>Дата<span className="text-[rgba(224,86,86,0.92)] ml-1" aria-hidden="true">*</span>:</label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>
                {(taskTypeInternal === 'income' || taskTypeInternal === 'task' || taskTypeInternal === 'lesson') && (
                  <div className="flex-1 min-w-0">
                    <label htmlFor="time" className={labelClass}>
                      Время{taskTypeInternal === 'lesson' ? <span className="text-[rgba(224,86,86,0.92)] ml-1" aria-hidden="true">*</span> : ''}:
                    </label>
                    <input
                      type="time"
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      className={inputClass}
                      required={taskTypeInternal === 'lesson'}
                    />
                  </div>
                )}
              </div>
            </div>

            {taskTypeInternal === 'lesson' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="address" className={labelClass}>Адрес / Аудитория:</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Например: Корпус Д, ауд. 301"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="reminder_at" className={labelClass}>Напомнить в:</label>
              <input
                type="datetime-local"
                id="reminder_at"
                name="reminder_at"
                value={formData.reminder_at || ''}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            {taskTypeInternal === 'task' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="assigned_to_id" className={labelClass}>Кому:</label>
                  <select
                    id="assigned_to_id"
                    name="assigned_to_id"
                    value={formData.assigned_to_id || ''}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="">Не назначено</option>
                    {assignableUsers.map(user => (
                      <option key={user.uuid} value={user.uuid}>{user.username}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reminder_offset" className={labelClass}>Напомнить за:</label>
                  <select
                    id="reminder_offset"
                    name="reminder_offset"
                    value={formData.reminder_offset || ''}
                    onChange={handleChange}
                    className={inputClass}
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
              <div className="flex flex-col gap-1.5">
                <label htmlFor="amount" className={labelClass}>Сумма{isAmountRequired && <span className="text-[rgba(224,86,86,0.92)] ml-1" aria-hidden="true">*</span>}:</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount ?? ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="0"
                  required={!isAmountDisabled}
                  disabled={isAmountDisabled}
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
                  className={inputClass}
                />
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="hoursWorked" className={labelClass}>Часов отработано:</label>
                  <input
                    type="number"
                    id="hoursWorked"
                    name="hoursWorked"
                    value={formData.hoursWorked ?? ''}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="0"
                  />
                </div>
              </>
            )}

            {taskTypeInternal === 'expense' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="expenseCategoryName" className={labelClass}>Категория<span className="text-[rgba(224,86,86,0.92)] ml-1" aria-hidden="true">*</span>:</label>
                <select
                  id="expenseCategoryName"
                  name="expenseCategoryName"
                  value={formData.expenseCategoryName}
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((category) => (
                    <option key={category.uuid} value={category.categoryName}>{category.categoryName}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="comments" className={labelClass}>Комментарий:</label>
              <textarea
                id="comments"
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                className={clsx(inputClass, 'min-h-[80px] resize-y')}
              />
            </div>

            <div className="shrink-0 flex flex-col gap-[var(--spacing-sm)] pt-[var(--spacing-md)] mt-[var(--spacing-sm)] border-t border-border-subtle min-[520px]:flex-row min-[520px]:justify-end">
              {mode === 'edit' && onDelete && initialTaskData?.uuid && (
                <button
                  type="button"
                  className={clsx(
                    'rounded-xl p-3 text-base font-semibold border-none transition-all duration-[160ms] inline-flex justify-center items-center gap-[var(--spacing-sm)]',
                    confirmingDelete
                      ? 'bg-[rgba(224,86,86,0.32)] text-[#ffb3b8] border border-[rgba(224,86,86,0.5)]'
                      : 'bg-[rgba(224,86,86,0.18)] text-[#ffb3b8] border border-[rgba(224,86,86,0.28)] hover:-translate-y-px hover:bg-[rgba(224,86,86,0.22)] hover:border-[rgba(224,86,86,0.36)]',
                  )}
                  onClick={handleDeleteClick}
                >
                  {confirmingDelete ? 'Точно удалить?' : 'Удалить'}
                </button>
              )}
              {!(mode === 'edit' && onDelete && initialTaskData?.uuid) && <div className="basis-[calc(50%-5px)]"></div>}

              <button
                type="submit"
                className="rounded-xl p-3 text-base font-semibold border-none bg-gradient-to-br from-[rgba(47,143,82,1)] to-[rgba(73,187,120,0.92)] text-[var(--btn-primary-text-color)] shadow-elevation-2 transition-all duration-[160ms] inline-flex justify-center items-center gap-[var(--spacing-sm)] hover:-translate-y-px hover:shadow-elevation-3 active:translate-y-0 active:shadow-elevation-2"
              >
                {mode === 'edit' ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {showChildFormModal && (
        <div
          className={clsx(
            'fixed inset-0 p-[clamp(12px,4vh,28px)_clamp(12px,4vw,24px)] bg-modal-overlay flex items-end justify-center z-[1050] font-[Inter,sans-serif] min-[768px]:items-center',
            isClosing && !showChildFormModal ? 'animate-fade-out' : 'animate-fade-in',
          )}
          onClick={handleChildFormCancel}
          data-testid="child-form-modal-overlay"
        >
          <div
            className={clsx(
              'w-[min(480px,100%)] max-h-[calc(100dvh-40px)] bg-modal-content rounded-[20px_20px_16px_16px] shadow-elevation-3 relative flex flex-col p-4 overflow-hidden min-[768px]:rounded-3xl',
              isClosing && !showChildFormModal ? 'animate-scale-down' : 'animate-scale-up',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 size-11 rounded-xl border border-white/[0.06] bg-white/[0.04] text-text-secondary text-xl leading-none inline-flex items-center justify-center transition-all duration-[160ms] hover:rotate-[-90deg] hover:border-white/[0.12] hover:bg-white/[0.08]"
              onClick={handleChildFormCancel}
            >
              &times;
            </button>
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
    return null;
  }
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default UnifiedTaskFormModal;
