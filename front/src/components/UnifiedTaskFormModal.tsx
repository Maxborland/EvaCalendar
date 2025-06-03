import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { toast } from 'react-toastify';
import { addChild, getAllChildren, getExpenseCategories, updateChild as updateChildAPI, type Child, type ExpenseCategory, type Task } from '../services/api';
import ChildForm from './ChildForm';
import UnifiedChildSelector from './UnifiedChildSelector';
import './UnifiedTaskFormModal.css';

interface UnifiedTaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Task | Omit<Task, 'uuid'>) => void;
  mode: 'create' | 'edit';
  initialTaskData?: Task;
  initialTaskType?: 'income' | 'expense';
  onDelete?: (uuid: string) => void;
  onDuplicate?: (uuid: string) => void;
}

// Вспомогательные функции для генерации имени задачи
const generateDynamicTaskTitle = (
  taskType: 'income' | 'expense',
  childName: string | undefined | null
): string => {
  if (taskType === 'income') {
    if (childName && childName.trim() !== '') {
      return `Доход от ${childName}`;
    }
    return ""; // Очищаем, если ребенок не выбран (для динамического обновления)
  }
  // Для расхода имя динамически от ребенка не зависит,
  // если было авто-имя от дохода, оно очистится в useEffect
  return "";
};

const generateFinalTaskTitleOnSubmit = (
  taskType: 'income' | 'expense',
  childName: string | undefined | null,
  categoryName: string | undefined | null
): string => {
  if (taskType === 'income') {
    if (childName && childName.trim() !== '') {
      return `Доход от ${childName}`;
    }
    return "Доход";
  } else if (taskType === 'expense') {
    if (categoryName && categoryName.trim() !== '') {
      return categoryName;
    }
    return "Расход";
  }
  return "Задача без названия"; // Фоллбэк
};

const UnifiedTaskFormModal: React.FC<UnifiedTaskFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialTaskData,
  initialTaskType,
  onDelete,
  onDuplicate,
}) => {
  const [taskTypeInternal, setTaskTypeInternal] = useState<'income' | 'expense'>(() => {
    if (mode === 'edit' && initialTaskData?.type) {
      // Если initialTaskType передан, он имеет приоритет
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
      expenceTypeId: initialTaskData?.expenceTypeId,
      child_name: initialTaskData?.child_name,
      originalTaskType: initialTaskData?.type
    };
    return baseData;
  });

  const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);

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
      console.error('Ошибка при загрузке детей:', error);
      toast.error('Ошибка при загрузке списка детей.');
    }
  }, []);

  useEffect(() => {
    console.log('[UnifiedTaskFormModal] useEffect for initialTaskData. initialTaskData:', initialTaskData);
    if (mode === 'edit' && initialTaskData) {
      // Установка taskTypeInternal при редактировании
      const determinedTaskType = initialTaskType || (initialTaskData.type === 'expense' ? 'expense' : 'income');
      setTaskTypeInternal(determinedTaskType);

      const taskAmount = initialTaskData.amount ?? (determinedTaskType === 'income' ? initialTaskData.amountEarned : initialTaskData.amountSpent) ?? undefined;
      console.log('[UnifiedTaskFormModal] Determined taskAmount for formData:', taskAmount, 'from initialTaskData.amount:', initialTaskData.amount, 'initialTaskData.amountEarned:', initialTaskData.amountEarned, 'initialTaskData.amountSpent:', initialTaskData.amountSpent);
      console.log('[UnifiedTaskFormModal] BEFORE newFormData: initialTaskData.childId =', initialTaskData.childId, ', type:', typeof initialTaskData.childId, '; initialTaskData.child_name =', initialTaskData.child_name, ', type:', typeof initialTaskData.child_name);

      const newFormData = {
        id: initialTaskData.uuid,
        title: initialTaskData.title ?? '',
        time: initialTaskData.time || '',
        address: initialTaskData.address || '',
        childId: initialTaskData.childId || null, // Используем childId из initialTaskData
        hourlyRate: initialTaskData.hourlyRate ?? undefined,
        comments: initialTaskData.comments || '',
        expenseCategoryName: initialTaskData.expenseCategoryName || '',
        amount: taskAmount,
        hoursWorked: initialTaskData.hoursWorked ?? undefined,
        dueDate: initialTaskData.dueDate ?? new Date().toISOString().split('T')[0],
        expenceTypeId: initialTaskData.expenceTypeId,
        child_name: initialTaskData.child_name, // Используем child_name из initialTaskData
        originalTaskType: initialTaskData.type,
      };
      console.log('[UnifiedTaskFormModal] newFormData PREPARED with childId:', newFormData.childId, '(type:', typeof newFormData.childId, ') and child_name:', newFormData.child_name, '(type:', typeof newFormData.child_name, ')');
      setFormData(newFormData);
      // Логируем состояние newFormData *после* вызова setFormData, используя JSON.parse(JSON.stringify()) для получения снимка состояния
      // Однако, прямой доступ к formData сразу после setFormData не даст обновленное значение из-за асинхронности.
      // Лог ниже покажет то, что БЫЛО передано в setFormData.
      console.log('[UnifiedTaskFormModal] formData set in edit mode (snapshot of data passed to setFormData):', JSON.parse(JSON.stringify(newFormData)));

      // Устанавливаем isNameManuallyEdited на основе initialTaskData.title в режиме редактирования
      const isInitialTitlePresentAndNotEmpty = !!(initialTaskData.title && initialTaskData.title.trim() !== '');
      setIsNameManuallyEdited(isInitialTitlePresentAndNotEmpty);
      console.log('[UnifiedTaskFormModal] In edit mode, isNameManuallyEdited set to:', isInitialTitlePresentAndNotEmpty, 'based on initialTaskData.title:', initialTaskData.title);

      const childIdToSetForSelector = initialTaskData.childId || null;
      setSelectedChildUuid(childIdToSetForSelector);
      console.log('[UnifiedTaskFormModal] setSelectedChildUuid called with:', childIdToSetForSelector, '(derived from initialTaskData.childId:', initialTaskData.childId + ")");
    } else if (mode === 'create') {
      setTaskTypeInternal(initialTaskType || 'income');
      const defaultDueDate = new Date().toISOString().split('T')[0];
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
        dueDate: defaultDueDate,
        expenceTypeId: undefined,
        child_name: undefined,
        originalTaskType: undefined,
      };
      setFormData(newFormData);
      setIsNameManuallyEdited(false); // Сброс при создании новой задачи
      console.log('[UnifiedTaskFormModal] formData set in create mode:', newFormData);
      setSelectedChildUuid(null);
    }
  }, [mode, initialTaskData, initialTaskType]); // initialTaskType добавлен, чтобы isNameManuallyEdited правильно сбрасывалось/устанавливалось при его изменении

  useEffect(() => {
    // Сброс полей при изменении taskTypeInternal
    // Этот эффект должен срабатывать ПОСЛЕ инициализации formData
    setFormData(prev => {
      const newFormData = { ...prev };
      console.log('[UnifiedTaskFormModal] useEffect for taskTypeInternal change. taskTypeInternal:', taskTypeInternal, 'prev.amount:', prev.amount);

      const initialAmount = initialTaskData?.amount;
      const initialAmountEarned = initialTaskData?.amountEarned;
      const initialAmountSpent = initialTaskData?.amountSpent;

      const preserveAmountFromInitial =
        mode === 'edit' &&
        initialTaskData &&
        (initialAmount !== undefined || initialAmountEarned !== undefined || initialAmountSpent !== undefined) && // Проверяем любое из полей суммы
        initialTaskData.type &&
        (
          ((initialTaskData.type === 'income' || initialTaskData.type === 'hourly' || initialTaskData.type === 'fixed') && taskTypeInternal === 'income') ||
          (initialTaskData.type === 'expense' && taskTypeInternal === 'expense')
        );

      console.log('[UnifiedTaskFormModal] preserveAmountFromInitial:', preserveAmountFromInitial);

      if (taskTypeInternal === 'expense') {
        newFormData.childId = null;
        newFormData.child_name = undefined;
        newFormData.hourlyRate = undefined;
        newFormData.hoursWorked = undefined;
        newFormData.time = '';
      } else if (taskTypeInternal === 'income') {
        newFormData.expenceTypeId = undefined;
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
        console.log('[UnifiedTaskFormModal] Amount preserved/set from initial (Earned/Spent):', newFormData.amount);
      } else {
        // Если не сохраняем из initial (например, тип задачи сменился или это создание новой)
        const isAutoCalculated = taskTypeInternal === 'income' &&
                                 typeof newFormData.hourlyRate === 'number' && newFormData.hourlyRate > 0 &&
                                 typeof newFormData.hoursWorked === 'number' && newFormData.hoursWorked > 0;
        if (!isAutoCalculated) {
             newFormData.amount = undefined; // Сбрасываем, если не авто-расчет и не сохранено из initial
             console.log('[UnifiedTaskFormModal] Amount reset to undefined (not auto-calculated, not preserved).');
        } else {
          console.log('[UnifiedTaskFormModal] Amount will be auto-calculated later.');
            }
          }
          console.log('[UnifiedTaskFormModal] formData after taskTypeInternal change logic:', JSON.parse(JSON.stringify(newFormData)));
          return newFormData;
        });
        setIsNameManuallyEdited(false); // Сбрасываем флаг при смене типа
      }, [taskTypeInternal, mode, initialTaskData]);


      const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getExpenseCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Ошибка при загрузке категорий:', error);
        toast.error('Ошибка при загрузке списка категорий.');
      }
    };
    fetchCategories();
    fetchChildrenCallback();
  }, [fetchChildrenCallback]);

  useEffect(() => {
    console.log('[UnifiedTaskFormModal] useEffect for selectedChildUuid. selectedChildUuid:', selectedChildUuid, 'children.length:', children.length);
    if (selectedChildUuid) {
      const childData = children.find(c => c.uuid === selectedChildUuid);
      console.log('[UnifiedTaskFormModal] Found childData by selectedChildUuid:', childData);
      if (childData) {
        setSelectedChildDetails(childData);
        setFormData((prevData) => {
          const updatedData = {
            ...prevData,
            childId: childData.uuid,
            hourlyRate: childData.hourlyRate ?? prevData.hourlyRate,
            address: childData.address || prevData.address,
            child_name: childData.childName,
          };
          console.log('[UnifiedTaskFormModal] Child found. Updating formData with child details:', JSON.parse(JSON.stringify(updatedData)));
          return updatedData;
        });
      } else if (children.length > 0 || (mode === 'create' && !initialTaskData?.childId) || (mode === 'edit' && initialTaskData && selectedChildUuid !== initialTaskData.childId)) {
        console.log('[UnifiedTaskFormModal] Child not found or selection cleared. Resetting child details in formData.');
        setSelectedChildDetails(null);
        if (!initialTaskData?.childId || selectedChildUuid !== initialTaskData.childId) { // Keep childId here as it's from initialTaskData
            setFormData(prev => {
              const resetData = {
                ...prev,
                childId: null,
                child_name: undefined,
              };
              console.log('[UnifiedTaskFormModal] Resetting childId in formData because child not found/selection changed:', JSON.parse(JSON.stringify(resetData)));
              return resetData;
            });
        }
      } else {
        console.log('[UnifiedTaskFormModal] Child not found, but not resetting yet (children list might be loading or selectedChildUuid matches initial).');
      }
    } else {
      console.log('[UnifiedTaskFormModal] selectedChildUuid is null. Resetting child details in formData.');
      setSelectedChildDetails(null);
      setFormData(prev => {
        const resetData = {
          ...prev,
          childId: null,
          child_name: undefined,
          hourlyRate: initialTaskData?.hourlyRate || undefined
        };
        console.log('[UnifiedTaskFormModal] Resetting childId in formData because selectedChildUuid is null:', JSON.parse(JSON.stringify(resetData)));
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

  // useEffect для динамического обновления имени задачи
  useEffect(() => {
    // Дополнительная проверка для режима редактирования при первой загрузке
    if (mode === 'edit' && initialTaskData?.title && formData.title === initialTaskData.title && initialTaskData.title.trim() !== '') {
      // Если мы в режиме редактирования, initialTaskData.title существует,
      // текущее formData.title совпадает с ним (т.е. это первая загрузка/инициализация),
      // и initialTaskData.title не пустое, то считаем, что это имя не должно автоматически меняться,
      // даже если isNameManuallyEdited еще не успело обновиться до true.
      // Это предотвращает перезапись имени, которое было загружено из initialTaskData.
      console.log('[UnifiedTaskFormModal DynamicTitle] In edit mode, initial title matches formData.title, skipping dynamic update for initial load.');
      return;
    }

    if (isNameManuallyEdited) {
      console.log('[UnifiedTaskFormModal DynamicTitle] Skipping update: name manually edited.');
      return;
    }

    const newPotentialTitle = generateDynamicTaskTitle(taskTypeInternal, selectedChildDetails?.childName);
    const currentTitle = formData.title || "";

    console.log(`[UnifiedTaskFormModal DynamicTitle] Current title: "${currentTitle}", Potential new: "${newPotentialTitle}", Child: ${selectedChildDetails?.childName}, Type: ${taskTypeInternal}`);

    let shouldUpdate = false;

    if (taskTypeInternal === 'income') {
      if (selectedChildDetails?.childName) { // Если ребенок выбран
        // Обновляем, если текущее имя пустое, или было "Доход", или было "Доход от ДРУГОГО_ИМЕНИ_РЕБЕНКА"
        const expectedNewTitleForSelectedChild = `Доход от ${selectedChildDetails.childName}`;
        if (currentTitle === "" || currentTitle === "Доход" || (currentTitle.startsWith("Доход от ") && currentTitle !== expectedNewTitleForSelectedChild)) {
          shouldUpdate = true;
        }
         // Если текущее имя уже правильное для выбранного ребенка, не обновляем
        if (currentTitle === expectedNewTitleForSelectedChild) {
            shouldUpdate = false;
        }
      } else { // Ребенок не выбран (или очищен)
        // Обновляем на пустую строку, если текущее имя было автосгенерировано для какого-либо ребенка или было "Доход"
        if (currentTitle.startsWith("Доход от ") || currentTitle === "Доход") {
          shouldUpdate = true;
        }
      }
    } else if (taskTypeInternal === 'expense') {
      // Если тип задачи - расход, и имя было автосгенерировано от дохода, очищаем его.
      if (currentTitle.startsWith("Доход от ") || currentTitle === "Доход") {
         shouldUpdate = true; // newPotentialTitle для расхода будет ""
      }
    }

    if (shouldUpdate && currentTitle !== newPotentialTitle) {
      console.log(`[UnifiedTaskFormModal DynamicTitle] Updating title from "${currentTitle}" to "${newPotentialTitle}"`);
      setFormData(prev => ({ ...prev, title: newPotentialTitle }));
    } else {
      console.log(`[UnifiedTaskFormModal DynamicTitle] No title update needed. Current: "${currentTitle}", Potential: "${newPotentialTitle}", ShouldUpdate: ${shouldUpdate}`);
    }

  }, [selectedChildDetails, taskTypeInternal, isNameManuallyEdited, formData.title, setFormData]); // Вернул formData.title в зависимости, т.к. currentTitle берется из него


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type: inputType } = e.target;
    if (name === 'title') {
      // Если пользователь вводит текст в поле title, устанавливаем isNameManuallyEdited в true.
      // Если пользователь стирает весь текст из поля title, устанавливаем isNameManuallyEdited в false,
      // чтобы автоматическая генерация имени снова могла сработать.
      setIsNameManuallyEdited(value.trim() !== '');
    }
    setFormData((prevData) => ({
      ...prevData,
      [name]: inputType === 'number'
        ? (value === '' ? undefined : parseFloat(value))
        : value,
    }));
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
      console.error("Ошибка при сохранении карточки ребенка из TaskForm:", error);
    }
  };

  const handleChildFormCancel = () => {
    setShowChildFormModal(false);
    setChildFormInitialData(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let titleForSubmit = formData.title; // Берем текущее название из формы
    const childNameForTitle = selectedChildUuid ? children.find(c => c.uuid === selectedChildUuid)?.childName : undefined;
    const expectedTitle = generateFinalTaskTitleOnSubmit(
      taskTypeInternal,
      childNameForTitle,
      formData.expenseCategoryName
    );

    const isTitleFieldEmpty = !formData.title || formData.title.trim() === '';
    let shouldForceUpdateTitle = false;

    if (isTitleFieldEmpty) {
      shouldForceUpdateTitle = true;
    } else {
      // Название не пустое, проверяем другие условия
      let configChangedSinceLoadOrManualEditImpliesOutdated = false;
      if (mode === 'edit' && initialTaskData) {
        const loadedChildId = initialTaskData.childId;
        const currentSelectedChildId = selectedChildDetails?.uuid || null;

        const loadedTaskTypeApi = initialTaskData.type; // 'income', 'expense', 'fixed', 'hourly'
        const loadedTaskTypeSimplified = (loadedTaskTypeApi === 'expense') ? 'expense' : 'income';

        if (loadedChildId !== currentSelectedChildId || loadedTaskTypeSimplified !== taskTypeInternal) {
          configChangedSinceLoadOrManualEditImpliesOutdated = true;
        }
      } else if (mode === 'create') {
        // В режиме создания, если название не пустое, но не соответствует ожидаемому,
        // это означает, что пользователь ввел что-то, а потом изменил ребенка/тип,
        // или просто ввел не то, что ожидается для текущих селекторов.
        if (formData.title !== expectedTitle) {
            configChangedSinceLoadOrManualEditImpliesOutdated = true;
        }
      }

      if (configChangedSinceLoadOrManualEditImpliesOutdated) {
        // Конфигурация изменилась (или в 'create' название не соответствует).
        // Если текущее название не соответствует новой/ожидаемой конфигурации, обновляем.
        if (formData.title !== expectedTitle) {
          shouldForceUpdateTitle = true;
        }
        // Если formData.title *соответствует* новой/ожидаемой конфигурации,
        // пользователь мог сам его поправить, поэтому shouldForceUpdateTitle остается false,
        // и пользовательский ввод сохранится.
      }
    }

    if (shouldForceUpdateTitle) {
      titleForSubmit = expectedTitle;
    }

    let taskTypeForApi: string;
    if (taskTypeInternal === 'expense') {
      taskTypeForApi = 'expense';
    } else { // income
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
      title: titleForSubmit,
      type: taskTypeForApi,
      time: taskTypeInternal === 'income' ? (formData.time || undefined) : undefined, // Время только для дохода
      dueDate: formData.dueDate, // Дата остается, хоть и невидима
      childId: taskTypeInternal === 'income' ? (selectedChildUuid || undefined) : undefined, // Это уже childId, все верно
      child_name: taskTypeInternal === 'income' ? (childNameForTitle || undefined) : undefined,
      expenceTypeId: taskTypeInternal === 'expense'
        ? categories.find(c => c.category_name === formData.expenseCategoryName)?.uuid
        : undefined,
      expenseCategoryName: taskTypeInternal === 'expense' ? formData.expenseCategoryName : undefined,
      amount: formData.amount,
      hourlyRate: taskTypeInternal === 'income' && taskTypeForApi === 'hourly' ? formData.hourlyRate : undefined,
      hoursWorked: taskTypeInternal === 'income' && taskTypeForApi === 'hourly' ? formData.hoursWorked : undefined,
      comments: formData.comments || undefined,
      taskType: taskTypeInternal,
    };

    if (taskTypeForApi === 'hourly' && dataToSave.hourlyRate && dataToSave.hoursWorked && dataToSave.amount === undefined) {
        dataToSave.amount = dataToSave.hourlyRate * dataToSave.hoursWorked;
    }

    onSubmit(dataToSave as Task | Omit<Task, 'uuid'>);
  };

  const handleDeleteClick = () => {
    if (mode === 'edit' && initialTaskData?.uuid && onDelete) {
      onDelete(initialTaskData.uuid);
    }
  };

  const handleDuplicateClick = () => {
    if (mode === 'edit' && initialTaskData?.uuid && onDuplicate) {
      onDuplicate(initialTaskData.uuid);
    }
  };

  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <>
      <div className="modal-overlay" onClick={onClose} data-testid="modal-overlay">
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-button" onClick={onClose}>&times;</button>
          <form className="form" onSubmit={handleSubmit}>
            <h2>{mode === 'edit' ? 'Редактирование задачи' : 'Создание задачи'}</h2>

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

            {/* Поле Дата скрыто согласно макету. Его значение берется из formData.dueDate */}

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
                {/* Поле "Ставка в час" скрыто согласно макету */}
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
                      <option key={category.uuid} value={category.category_name}>{category.category_name}</option>
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
                <button type="button" className="delete-button-form" onClick={handleDeleteClick}>
                  Удалить
                </button>
              )}
              {!(mode === 'edit' && onDelete && initialTaskData?.uuid) && <div style={{ flexBasis: 'calc(50% - 5px)' }}></div>}

              <button type="submit" className="submit-button">
                {mode === 'edit' ? 'Сохранить' : 'Создать'}
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
    console.error("Элемент с id 'modal-root' не найден в DOM.");
    return null;
  }
  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default UnifiedTaskFormModal;