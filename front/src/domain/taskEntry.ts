import type { Child, ExpenseCategory, Task } from '../services/api';
import { getTaskRecordKind, type TaskRecordKind } from './taskRecord';

export type TaskEntryType = TaskRecordKind;

export interface TaskEntryFormData {
  id?: string;
  title: string;
  time: string;
  address: string;
  childId: string | null;
  hourlyRate?: number;
  comments: string;
  expenseCategoryName: string;
  amount?: number;
  hoursWorked?: number;
  dueDate: string;
  expense_category_uuid?: string | null;
  childName?: string | null;
  originalTaskType?: Task['type'];
  reminder_at: string;
  reminder_offset: number | string | null;
  assigned_to_id: string | null;
}

export interface TaskEntryState {
  taskType: TaskEntryType;
  formData: TaskEntryFormData;
  selectedChildUuid: string | null;
}

export interface BuildInitialTaskEntryStateParams {
  mode: 'create' | 'edit';
  initialTaskType?: TaskEntryType;
  initialTaskData?: Task;
  today: string;
}

export interface ApplyTaskEntryTypeParams {
  formData: TaskEntryFormData;
  nextType: TaskEntryType;
}

export function formatDateTimeForInput(isoDateTime: string | null | undefined): string {
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
  } catch {
    return '';
  }
}

export const getFallbackTaskTitle = (
  taskType: TaskEntryType,
  childName?: string | null,
  expenseCategoryName?: string | null,
) => {
  if (taskType === 'income') {
    return childName ? `Оплата: ${childName}` : 'Доход';
  }
  if (taskType === 'expense') {
    return expenseCategoryName ? `Расход: ${expenseCategoryName}` : 'Расход';
  }
  if (taskType === 'lesson') {
    return childName ? `Занятие: ${childName}` : 'Занятие';
  }
  return 'Задача';
};

const getTaskAmountForForm = (task: Task | undefined, taskType: TaskEntryType) => {
  if (!task) return undefined;
  if (typeof task.amount === 'number') return task.amount;
  if (taskType === 'income') return task.amountEarned;
  if (taskType === 'expense') return task.amountSpent;
  return undefined;
};

const getInitialChildUuid = (task: Task | undefined) => task?.child_uuid || task?.childId || null;

export const applyTaskEntryType = ({ formData, nextType }: ApplyTaskEntryTypeParams): Omit<TaskEntryState, 'taskType'> => {
  const nextData: TaskEntryFormData = { ...formData };
  let selectedChildUuid = nextData.childId;

  if (nextType === 'expense') {
    nextData.time = '';
    nextData.address = '';
    nextData.childId = null;
    nextData.childName = undefined;
    nextData.hourlyRate = undefined;
    nextData.hoursWorked = undefined;
    nextData.assigned_to_id = null;
    nextData.reminder_offset = null;
    selectedChildUuid = null;
  } else if (nextType === 'income') {
    nextData.address = '';
    nextData.expense_category_uuid = undefined;
    nextData.expenseCategoryName = '';
    nextData.assigned_to_id = null;
    nextData.reminder_offset = null;
    selectedChildUuid = nextData.childId;
  } else if (nextType === 'task') {
    nextData.address = '';
    nextData.amount = undefined;
    nextData.expense_category_uuid = undefined;
    nextData.expenseCategoryName = '';
    nextData.childId = null;
    nextData.childName = undefined;
    nextData.hourlyRate = undefined;
    nextData.hoursWorked = undefined;
    selectedChildUuid = null;
  } else {
    nextData.amount = undefined;
    nextData.expense_category_uuid = undefined;
    nextData.expenseCategoryName = '';
    nextData.hourlyRate = undefined;
    nextData.hoursWorked = undefined;
    nextData.assigned_to_id = null;
    nextData.reminder_offset = null;
    selectedChildUuid = nextData.childId;
  }

  return { formData: nextData, selectedChildUuid };
};

export const buildInitialTaskEntryState = ({
  mode,
  initialTaskType,
  initialTaskData,
  today,
}: BuildInitialTaskEntryStateParams): TaskEntryState => {
  const taskType = mode === 'edit' && initialTaskData
    ? getTaskRecordKind(initialTaskData)
    : initialTaskType || 'income';
  const childUuid = (taskType === 'income' || taskType === 'lesson')
    ? getInitialChildUuid(initialTaskData)
    : null;
  const hourlyRate = taskType === 'income' ? initialTaskData?.hourlyRate : undefined;
  const hoursWorked = taskType === 'income'
    ? (initialTaskData?.hoursWorked ?? (mode === 'create' && hourlyRate ? 1 : undefined))
    : undefined;
  const amount = taskType === 'income' && hourlyRate && hoursWorked && getTaskAmountForForm(initialTaskData, taskType) === undefined
    ? hourlyRate * hoursWorked
    : getTaskAmountForForm(initialTaskData, taskType);

  const baseData: TaskEntryFormData = {
    id: mode === 'edit' ? initialTaskData?.uuid : undefined,
    title: initialTaskData?.title || '',
    time: initialTaskData?.time || '',
    address: initialTaskData?.address || '',
    childId: childUuid,
    hourlyRate,
    comments: initialTaskData?.comments || '',
    expenseCategoryName: taskType === 'expense' ? (initialTaskData?.expenseCategoryName || '') : '',
    amount: taskType === 'income' || taskType === 'expense' ? amount : undefined,
    hoursWorked,
    dueDate: initialTaskData?.dueDate || today,
    expense_category_uuid: taskType === 'expense' ? initialTaskData?.expense_category_uuid : undefined,
    childName: taskType === 'income' || taskType === 'lesson' ? initialTaskData?.childName : undefined,
    originalTaskType: mode === 'edit' ? initialTaskData?.type : undefined,
    reminder_at: formatDateTimeForInput(initialTaskData?.reminder_at),
    reminder_offset: taskType === 'task' ? (initialTaskData?.reminder_offset ?? null) : null,
    assigned_to_id: taskType === 'task'
      ? (initialTaskData?.user_uuid || initialTaskData?.assigned_to_id || null)
      : null,
  };
  const typedState = applyTaskEntryType({ formData: baseData, nextType: taskType });

  return {
    taskType,
    formData: typedState.formData,
    selectedChildUuid: typedState.selectedChildUuid,
  };
};

export interface BuildTaskEntryPayloadParams {
  formData: TaskEntryFormData;
  taskType: TaskEntryType;
  mode: 'create' | 'edit';
  initialTaskData?: Task;
  selectedChildUuid: string | null;
  children: Child[];
  categories: ExpenseCategory[];
}

export const buildTaskEntryPayload = ({
  formData,
  taskType,
  mode,
  initialTaskData,
  selectedChildUuid,
  children,
  categories,
}: BuildTaskEntryPayloadParams): Omit<Task, 'uuid'> & { uuid?: string } => {
  const canHaveChild = taskType === 'income' || taskType === 'lesson';
  const selectedChildForPayload = canHaveChild
    ? selectedChildUuid ?? (mode === 'edit' ? null : undefined)
    : undefined;
  const selectedExpenseCategoryUuid = taskType === 'expense'
    ? categories.find((category) => category.categoryName === formData.expenseCategoryName)?.uuid
      ?? (mode === 'edit' ? null : undefined)
    : undefined;
  const childNameForTitle = selectedChildUuid
    ? children.find((child) => child.uuid === selectedChildUuid)?.childName
    : undefined;
  const reminderAtUTC = formData.reminder_at
    ? new Date(formData.reminder_at).toISOString()
    : null;
  const titleToSave = formData.title.trim() || getFallbackTaskTitle(
    taskType,
    childNameForTitle || formData.childName,
    formData.expenseCategoryName,
  );

  const dataToSave: Omit<Task, 'uuid'> & { uuid?: string } = {
    uuid: mode === 'edit' ? initialTaskData?.uuid : undefined,
    title: titleToSave,
    type: taskType,
    time: (taskType === 'income' || taskType === 'task' || taskType === 'lesson')
      ? (formData.time || undefined)
      : undefined,
    dueDate: formData.dueDate,
    address: taskType === 'lesson' ? (formData.address || undefined) : undefined,
    childId: selectedChildForPayload,
    child_uuid: selectedChildForPayload,
    childName: (taskType === 'income' || taskType === 'lesson') ? (childNameForTitle || undefined) : undefined,
    expense_category_uuid: selectedExpenseCategoryUuid,
    amount: (taskType === 'income' || taskType === 'expense') ? formData.amount : undefined,
    hourlyRate: taskType === 'income' ? formData.hourlyRate : undefined,
    hoursWorked: taskType === 'income' ? formData.hoursWorked : undefined,
    comments: formData.comments || undefined,
    reminder_at: reminderAtUTC,
    assigned_to_id: taskType === 'task' ? formData.assigned_to_id : null,
    reminder_offset: taskType === 'task' ? formData.reminder_offset : null,
    assignee_username: undefined,
  };

  if (taskType === 'income' && dataToSave.hourlyRate && dataToSave.hoursWorked && dataToSave.amount === undefined) {
    dataToSave.amount = dataToSave.hourlyRate * dataToSave.hoursWorked;
  }

  return dataToSave;
};
