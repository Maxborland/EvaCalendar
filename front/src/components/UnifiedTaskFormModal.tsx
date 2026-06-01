import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import * as ReactDOM from 'react-dom';
import { toast } from 'react-toastify';
import {
  applyTaskEntryType,
  buildInitialTaskEntryState,
  buildTaskEntryPayload,
  type TaskEntryFormData,
  type TaskEntryType,
} from '../domain/taskEntry';
import { getTodayDateString } from '../domain/datePeriod';
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
  initialTaskType?: TaskFormType;
  onDelete?: (uuid: string) => void;
  onDuplicate?: (uuid: string) => void;
  onTaskUpsert?: () => void;
}

type TaskFormType = TaskEntryType;

interface TaskTypeOption {
  value: TaskFormType;
  label: string;
  description: string;
  icon: string;
  className: string;
}

const inputClass = 'w-full min-w-0 max-w-full rounded-xl border border-border-subtle bg-surface-elevated text-text-primary py-2.5 px-3 text-sm transition-all duration-[160ms] box-border focus-visible:outline-none focus-visible:border-[rgba(72,187,120,0.6)] focus-visible:shadow-[0_0_0_3px_rgba(72,187,120,0.16)]';
const labelClass = 'text-sm font-medium text-text-primary leading-tight';
const typeOptions: TaskTypeOption[] = [
  {
    value: 'income',
    label: 'Доход',
    description: 'Оплата от ребенка',
    icon: 'add_card',
    className: 'border-income-border bg-income-bg text-income-primary',
  },
  {
    value: 'expense',
    label: 'Расход',
    description: 'Покупка или трата',
    icon: 'payments',
    className: 'border-expense-border bg-expense-bg text-expense-primary',
  },
  {
    value: 'task',
    label: 'Задача',
    description: 'Сделать или поручить',
    icon: 'task_alt',
    className: 'border-[var(--color-task-border)] bg-[var(--color-task-bg)] text-[var(--color-task-primary)]',
  },
  {
    value: 'lesson',
    label: 'Занятие',
    description: 'Пара, урок, встреча',
    icon: 'school',
    className: 'border-[var(--color-lesson-border)] bg-[var(--color-lesson-bg)] text-[var(--color-lesson-primary)]',
  },
];

const typeTitlePlaceholder: Record<TaskFormType, string> = {
  income: 'Например: Оплата за занятие',
  expense: 'Например: Материалы для урока',
  task: 'Например: Напомнить родителю',
  lesson: 'Например: Математика',
};

const modalTitleByType: Record<TaskFormType, string> = {
  income: 'Новый доход',
  expense: 'Новый расход',
  task: 'Новая задача',
  lesson: 'Новое занятие',
};

const hourPresets = [0.5, 1, 1.5, 2];

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
  const buildInitialState = useCallback(() => buildInitialTaskEntryState({
    mode,
    initialTaskData,
    initialTaskType,
    today: getTodayDateString(),
  }), [initialTaskData, initialTaskType, mode]);
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

  const [taskTypeInternal, setTaskTypeInternal] = useState<TaskFormType>(() => buildInitialState().taskType);
  const [formData, setFormData] = useState<TaskEntryFormData>(() => buildInitialState().formData);


  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildUuid, setSelectedChildUuid] = useState<string | null>(() => buildInitialState().selectedChildUuid);
  const [selectedChildDetails, setSelectedChildDetails] = useState<Child | null>(null);

  const [showChildFormModal, setShowChildFormModal] = useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [childFormInitialData, setChildFormInitialData] = useState<Partial<Child> | undefined>(undefined);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);


  const fetchChildrenCallback = useCallback(async () => {
    try {
      const fetchedChildren = await getAllChildren();
      setChildren(fetchedChildren);
    } catch {
      toast.error('Ошибка при загрузке списка детей.');
    }
  }, []);

  useEffect(() => {
    const nextState = buildInitialState();
    setTaskTypeInternal(nextState.taskType);
    setSelectedChildUuid(nextState.selectedChildUuid);
    setFormData(nextState.formData);
    setShowAdvancedFields(false);

  }, [buildInitialState]);


      const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getExpenseCategories();
        setCategories(fetchedCategories);
      } catch {
        toast.error('Ошибка при загрузке списка категорий.');
      }
    };
    fetchCategories();
    fetchChildrenCallback();

    const fetchAssignableUsers = async () => {
      try {
        const users = await getAssignableUsers();
        setAssignableUsers(users);
      } catch {
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
          const defaultIncomeHours = taskTypeInternal === 'income' && !prevData.hoursWorked && childData.hourlyRate
            ? 1
            : prevData.hoursWorked;
          const defaultIncomeAmount = taskTypeInternal === 'income' && !prevData.amount && childData.hourlyRate && defaultIncomeHours
            ? childData.hourlyRate * defaultIncomeHours
            : prevData.amount;
          const updatedData = {
            ...prevData,
            childId: childData.uuid,
            hourlyRate: childData.hourlyRate ?? prevData.hourlyRate,
            address: childData.address || prevData.address,
            childName: childData.childName,
            hoursWorked: defaultIncomeHours,
            amount: defaultIncomeAmount,
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
  }, [selectedChildUuid, children, initialTaskData, mode, taskTypeInternal]);

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
      return newFormData;
    });
  };

  const handleTaskTypeChange = (nextType: TaskFormType) => {
    setTaskTypeInternal(nextType);
    setShowAdvancedFields(false);

    setFormData((prevData) => {
      const nextState = applyTaskEntryType({ formData: prevData, nextType });
      setSelectedChildUuid(nextState.selectedChildUuid);
      return nextState.formData;
    });
  };

  const handleUnifiedChildChange = (childUuid: string | null) => {
    setSelectedChildUuid(childUuid);
  };

  const setHoursWorkedPreset = (hoursWorked: number) => {
    setFormData((prevData) => ({
      ...prevData,
      hoursWorked,
      amount: typeof prevData.hourlyRate === 'number' && prevData.hourlyRate > 0
        ? prevData.hourlyRate * hoursWorked
        : prevData.amount,
    }));
  };

  const setAmountPreset = (amount: number) => {
    setFormData((prevData) => ({
      ...prevData,
      amount,
    }));
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
        const dataToSend = { ...childDataFromForm };
        delete dataToSend.uuid;
        savedOrUpdatedChild = await addChild(dataToSend as Omit<Child, 'uuid'>);
        toast.success('Новая карточка ребенка успешно добавлена!');
      }
      setShowChildFormModal(false);
      await fetchChildrenCallback();
      setSelectedChildUuid(savedOrUpdatedChild.uuid);
    } catch {
      toast.error('Ошибка при сохранении карточки ребенка.');
    }
  };

  const handleChildFormCancel = () => {
    setShowChildFormModal(false);
    setChildFormInitialData(undefined);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const dataToSave = buildTaskEntryPayload({
      formData,
      taskType: taskTypeInternal,
      mode,
      initialTaskData,
      selectedChildUuid,
      children,
      categories,
    });

    try {
      await onSubmit(dataToSave as Task | Omit<Task, 'uuid'>);
      if (onTaskUpsert) {
        onTaskUpsert();
      }
    } catch {
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
  const amountPresets = taskTypeInternal === 'expense'
    ? [300, 500, 1000, 2000]
    : [1000, 1500, 2000, 3000];
  const activeTypeOption = typeOptions.find((option) => option.value === taskTypeInternal) || typeOptions[0];
  const isTitleRequired = taskTypeInternal === 'task';
  const submitLabelByType: Record<TaskFormType, string> = {
    income: 'Создать доход',
    expense: 'Создать расход',
    task: 'Создать задачу',
    lesson: 'Создать занятие',
  };

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
          <form className="mt-[var(--spacing-md)] flex flex-col gap-[var(--spacing-md)] overflow-y-auto pr-1 flex-1 min-h-0 scrollbar-thin" onSubmit={handleSubmit}>
            <div className="pr-12">
              <h2 className="m-0 text-lg font-semibold text-text-primary leading-tight">
                {mode === 'edit' ? 'Редактирование' : modalTitleByType[taskTypeInternal]}
              </h2>
              <p className="m-0 mt-1 text-xs text-text-tertiary leading-normal">{activeTypeOption.description}</p>
            </div>

            <div className="flex flex-col gap-2">
              <span className={labelClass}>Что добавить</span>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Тип записи">
                {typeOptions.map((option) => {
                  const isActive = taskTypeInternal === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      className={clsx(
                        'min-h-[64px] rounded-xl border px-3 py-2 text-left transition-all duration-[160ms] active:scale-[0.98]',
                        'flex items-center gap-2.5',
                        option.className,
                        isActive
                          ? 'shadow-[0_0_0_2px_currentColor,var(--elevation-1)]'
                          : 'opacity-72 hover:opacity-100',
                      )}
                      onClick={() => handleTaskTypeChange(option.value)}
                    >
                      <span className="material-icons text-[22px] shrink-0" aria-hidden="true">{option.icon}</span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-tight">{option.label}</span>
                        <span className="block text-[0.6875rem] leading-tight text-text-secondary mt-0.5">{option.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className={labelClass}>
                Название{isTitleRequired && <span className="text-[rgba(224,86,86,0.92)] ml-1" aria-hidden="true">*</span>}:
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={inputClass}
                placeholder={typeTitlePlaceholder[taskTypeInternal]}
                required={isTitleRequired}
              />
              {!isTitleRequired && (
                <p className="m-0 text-[0.6875rem] leading-tight text-text-tertiary">
                  Можно оставить пустым, название подставится автоматически.
                </p>
              )}
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
                {!isAmountDisabled && (
                  <div className="grid grid-cols-4 gap-1.5">
                    {amountPresets.map((amount) => {
                      const isActive = formData.amount === amount;
                      return (
                        <button
                          key={amount}
                          type="button"
                          className={clsx(
                            'min-h-10 rounded-xl border px-2 text-xs font-semibold active:scale-[0.98]',
                            isActive
                              ? activeTypeOption.className
                              : 'border-border-subtle bg-surface-elevated text-text-secondary',
                          )}
                          onClick={() => setAmountPreset(amount)}
                        >
                          {amount} ₽
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {(taskTypeInternal === 'income' || taskTypeInternal === 'lesson') && (
              <>
                <UnifiedChildSelector
                  value={selectedChildUuid}
                  onChange={handleUnifiedChildChange}
                  childrenList={children}
                  onAddNewChildRequest={() => handleOpenChildFormForNew(undefined)}
                  onGoToCreateChildPageRequest={handleOpenChildFormDefault}
                  label={taskTypeInternal === 'lesson' ? 'Ребенок:' : 'Имя ребенка:'}
                  placeholder="Выберите или добавьте ребенка"
                  selectedChildDetails={selectedChildDetails}
                  className={inputClass}
                />
                {taskTypeInternal === 'income' && (
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
                    <div className="grid grid-cols-4 gap-1.5">
                      {hourPresets.map((hoursWorked) => {
                        const isActive = formData.hoursWorked === hoursWorked;
                        return (
                          <button
                            key={hoursWorked}
                            type="button"
                            className={clsx(
                              'min-h-10 rounded-xl border px-2 text-xs font-semibold active:scale-[0.98]',
                              isActive
                                ? 'border-income-border bg-income-bg text-income-primary'
                                : 'border-border-subtle bg-surface-elevated text-text-secondary',
                            )}
                            onClick={() => setHoursWorkedPreset(hoursWorked)}
                          >
                            {hoursWorked} ч
                          </button>
                        );
                      })}
                    </div>
                    {typeof formData.hourlyRate === 'number' && formData.hourlyRate > 0 && (
                      <p className="m-0 text-[0.6875rem] leading-tight text-text-tertiary">
                        Ставка {formData.hourlyRate} ₽/ч, сумма посчитается автоматически.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {taskTypeInternal === 'expense' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="expenseCategoryName" className={labelClass}>Категория:</label>
                <select
                  id="expenseCategoryName"
                  name="expenseCategoryName"
                  value={formData.expenseCategoryName}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Без категории</option>
                  {categories.map((category) => (
                    <option key={category.uuid} value={category.categoryName}>{category.categoryName}</option>
                  ))}
                </select>
                <p className="m-0 text-[0.6875rem] leading-tight text-text-tertiary">
                  Можно добавить расход без категории и разобрать позже.
                </p>
              </div>
            )}

            <section className="rounded-2xl border border-border-subtle bg-surface-muted p-2">
              <button
                type="button"
                className="w-full min-h-11 rounded-xl border border-transparent bg-transparent px-2 text-sm font-semibold text-text-primary inline-flex items-center justify-between gap-3 active:scale-[0.99]"
                onClick={() => setShowAdvancedFields((value) => !value)}
                aria-expanded={showAdvancedFields}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="material-icons text-[18px] text-text-tertiary" aria-hidden="true">tune</span>
                  Детали
                </span>
                <span className="material-icons text-[20px] text-text-tertiary" aria-hidden="true">
                  {showAdvancedFields ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {showAdvancedFields && (
                <div className="mt-2 flex flex-col gap-3 px-1 pb-1">
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
                </div>
              )}
            </section>

            <div className="sticky bottom-0 z-10 -mx-1 flex shrink-0 flex-col gap-[var(--spacing-sm)] border-t border-border-subtle bg-modal-content px-1 pt-3 pb-1 shadow-[0_-14px_24px_rgba(8,13,24,0.28)] min-[520px]:flex-row min-[520px]:justify-end">
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
                className="min-h-12 rounded-xl p-3 text-base font-semibold border-none bg-gradient-to-br from-[rgba(47,143,82,1)] to-[rgba(73,187,120,0.92)] text-[var(--btn-primary-text-color)] shadow-elevation-2 transition-all duration-[160ms] inline-flex justify-center items-center gap-[var(--spacing-sm)] hover:-translate-y-px hover:shadow-elevation-3 active:translate-y-0 active:shadow-elevation-2"
              >
                {mode === 'edit' ? 'Сохранить' : submitLabelByType[taskTypeInternal]}
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
