import type { Task } from '../services/api';

export type TaskRecordKind = 'income' | 'expense' | 'task' | 'lesson';

export const isIncomeTask = (task: Pick<Task, 'type'>) =>
  task.type === 'income' || task.type === 'hourly' || task.type === 'fixed';

export const isExpenseTask = (task: Pick<Task, 'type'>) => task.type === 'expense';

export const isMoneyTask = (task: Pick<Task, 'type'>) => isIncomeTask(task) || isExpenseTask(task);

export const getTaskRecordKind = (task: Pick<Task, 'type'>): TaskRecordKind => {
  if (isIncomeTask(task)) return 'income';
  if (isExpenseTask(task)) return 'expense';
  if (task.type === 'lesson') return 'lesson';
  return 'task';
};

export const getTaskAmount = (
  task: Pick<Task, 'type' | 'amount' | 'amountEarned' | 'amountSpent'>,
) => {
  if (typeof task.amount === 'number') return task.amount;
  if (isExpenseTask(task) && typeof task.amountSpent === 'number') return task.amountSpent;
  if (isIncomeTask(task) && typeof task.amountEarned === 'number') return task.amountEarned;
  return 0;
};

export const getOptionalTaskAmount = (
  task: Pick<Task, 'type' | 'amount' | 'amountEarned' | 'amountSpent'>,
) => {
  if (typeof task.amount === 'number') return task.amount;
  if (isExpenseTask(task) && typeof task.amountSpent === 'number') return task.amountSpent;
  if (isIncomeTask(task) && typeof task.amountEarned === 'number') return task.amountEarned;
  return undefined;
};

type ChildKeySource = {
  uuid?: string;
  child_uuid?: string | null;
  childId?: string | null;
  childName?: string | null;
};

export const getTaskChildKey = (task: ChildKeySource) =>
  task.child_uuid || task.childId || task.childName?.trim();

export const isTaskForChild = (
  task: ChildKeySource,
  child: ChildKeySource,
) => {
  const taskChildUuid = task.child_uuid || task.childId;
  const childUuid = child.child_uuid || child.childId || child.uuid;
  if (taskChildUuid && childUuid && taskChildUuid === childUuid) return true;
  if (task.childName && child.childName && task.childName === child.childName) return true;

  const taskChildKey = getTaskChildKey(task);
  const childKey = getTaskChildKey(child);
  return Boolean(taskChildKey && childKey && taskChildKey === childKey);
};

export const hasSameTaskChild = (
  left: Pick<Task, 'child_uuid' | 'childId' | 'childName'>,
  right: Pick<Task, 'child_uuid' | 'childId' | 'childName'>,
) => isTaskForChild(left, right);

export const getTaskTimeRank = (task: Pick<Task, 'time'>) => {
  if (typeof task.time === 'string' && /^\d{2}:\d{2}$/.test(task.time)) {
    return task.time;
  }
  return '99:99';
};

export const compareTasksByTime = (left: Pick<Task, 'time'>, right: Pick<Task, 'time'>) =>
  getTaskTimeRank(left).localeCompare(getTaskTimeRank(right));
