import { describe, expect, it } from 'vitest';
import type { Child, ExpenseCategory, Task } from '../services/api';
import { buildTaskEntryPayload, formatDateTimeForInput, getFallbackTaskTitle, type TaskEntryFormData } from './taskEntry';

const children: Child[] = [
  {
    uuid: 'child-1',
    childName: 'Аня',
    parentName: 'Мария',
    parentPhone: null,
    address: null,
    hourlyRate: 1500,
    comment: null,
  },
];

const categories: ExpenseCategory[] = [
  { uuid: 'category-1', categoryName: 'Материалы' },
];

const baseFormData: TaskEntryFormData = {
  title: '',
  time: '15:30',
  address: 'ул. Ленина, 1',
  childId: null,
  comments: '',
  expenseCategoryName: '',
  dueDate: '2026-06-01',
  reminder_at: '',
  reminder_offset: null,
  assigned_to_id: null,
};

describe('taskEntry contract', () => {
  it('builds an income payload from selected child and calculated hourly amount', () => {
    const payload = buildTaskEntryPayload({
      formData: {
        ...baseFormData,
        hourlyRate: 1500,
        hoursWorked: 2,
      },
      taskType: 'income',
      mode: 'create',
      selectedChildUuid: 'child-1',
      children,
      categories,
    });

    expect(payload).toMatchObject({
      title: 'Оплата: Аня',
      type: 'income',
      dueDate: '2026-06-01',
      time: '15:30',
      childId: 'child-1',
      child_uuid: 'child-1',
      childName: 'Аня',
      hourlyRate: 1500,
      hoursWorked: 2,
      amount: 3000,
      assigned_to_id: null,
      reminder_offset: null,
    });
  });

  it('builds an expense payload with category and no child fields', () => {
    const payload = buildTaskEntryPayload({
      formData: {
        ...baseFormData,
        amount: 700,
        expenseCategoryName: 'Материалы',
      },
      taskType: 'expense',
      mode: 'create',
      selectedChildUuid: null,
      children,
      categories,
    });

    expect(payload).toMatchObject({
      title: 'Расход: Материалы',
      type: 'expense',
      amount: 700,
      expense_category_uuid: 'category-1',
      time: undefined,
      child_uuid: undefined,
      assigned_to_id: null,
      reminder_offset: null,
    });
  });

  it('sends null when editing an expense and clearing the selected category', () => {
    const payload = buildTaskEntryPayload({
      formData: {
        ...baseFormData,
        title: 'Расход без категории',
        amount: 700,
        expenseCategoryName: '',
      },
      taskType: 'expense',
      mode: 'edit',
      initialTaskData: {
        uuid: 'expense-1',
        title: 'Расход: Материалы',
        type: 'expense',
        dueDate: '2026-06-01',
        expense_category_uuid: 'category-1',
      } as Task,
      selectedChildUuid: null,
      children,
      categories,
    });

    expect(payload).toMatchObject({
      uuid: 'expense-1',
      type: 'expense',
      expense_category_uuid: null,
    });
  });

  it('keeps task reminders and assignment only for task entries', () => {
    const reminderInput = '2026-06-01T14:00';
    const payload = buildTaskEntryPayload({
      formData: {
        ...baseFormData,
        title: 'Позвонить родителю',
        reminder_at: reminderInput,
        reminder_offset: '30 minutes',
        assigned_to_id: 'user-2',
      },
      taskType: 'task',
      mode: 'edit',
      initialTaskData: { uuid: 'task-1', title: 'Old', type: 'task', dueDate: '2026-06-01' } as Task,
      selectedChildUuid: null,
      children,
      categories,
    });

    expect(payload).toMatchObject({
      uuid: 'task-1',
      title: 'Позвонить родителю',
      type: 'task',
      assigned_to_id: 'user-2',
      reminder_offset: '30 minutes',
      reminder_at: new Date(reminderInput).toISOString(),
    });
  });

  it('sends null when editing a lesson and clearing the selected child', () => {
    const payload = buildTaskEntryPayload({
      formData: {
        ...baseFormData,
        title: 'Занятие без привязки',
      },
      taskType: 'lesson',
      mode: 'edit',
      initialTaskData: {
        uuid: 'lesson-1',
        title: 'Занятие: Аня',
        type: 'lesson',
        dueDate: '2026-06-01',
        child_uuid: 'child-1',
        childId: 'child-1',
      } as Task,
      selectedChildUuid: null,
      children,
      categories,
    });

    expect(payload).toMatchObject({
      uuid: 'lesson-1',
      type: 'lesson',
      childId: null,
      child_uuid: null,
    });
  });

  it('formats existing reminder datetime for native datetime-local inputs', () => {
    expect(formatDateTimeForInput('2026-06-01T08:05:00.000Z')).toMatch(/2026-06-01T\d{2}:05/);
    expect(formatDateTimeForInput('not-a-date')).toBe('');
    expect(getFallbackTaskTitle('lesson', 'Аня')).toBe('Занятие: Аня');
  });
});
