import type { Child, ExpenseCategory, Task } from '../services/api';
import type { TaskRecordKind } from './taskRecord';

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
  expense_category_uuid?: string;
  childName?: string | null;
  originalTaskType?: Task['type'];
  reminder_at: string;
  reminder_offset: number | string | null;
  assigned_to_id: string | null;
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
    expense_category_uuid: taskType === 'expense'
      ? categories.find((category) => category.categoryName === formData.expenseCategoryName)?.uuid
      : undefined,
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
