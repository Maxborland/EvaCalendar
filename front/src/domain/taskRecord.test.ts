import { describe, expect, it } from 'vitest';
import type { Task } from '../services/api';
import {
  compareTasksByTime,
  getOptionalTaskAmount,
  getTaskAmount,
  getTaskChildKey,
  getTaskRecordKind,
  hasSameTaskChild,
  isIncomeTask,
  isMoneyTask,
  isTaskForChild,
} from './taskRecord';

const makeTask = (overrides: Partial<Task>): Task => ({
  uuid: 'task-1',
  title: 'Task',
  type: 'task',
  dueDate: '2026-06-01',
  ...overrides,
});

describe('taskRecord contract', () => {
  it('normalizes money task kinds and amounts across API aliases', () => {
    expect(getTaskRecordKind(makeTask({ type: 'hourly' }))).toBe('income');
    expect(getTaskRecordKind(makeTask({ type: 'fixed' }))).toBe('income');
    expect(getTaskRecordKind(makeTask({ type: 'expense' }))).toBe('expense');
    expect(isIncomeTask(makeTask({ type: 'income' }))).toBe(true);
    expect(isMoneyTask(makeTask({ type: 'expense' }))).toBe(true);

    expect(getTaskAmount(makeTask({ type: 'income', amountEarned: 3200 }))).toBe(3200);
    expect(getTaskAmount(makeTask({ type: 'expense', amountSpent: 900 }))).toBe(900);
    expect(getTaskAmount(makeTask({ type: 'income', amount: 1500, amountEarned: 3200 }))).toBe(1500);
    expect(getOptionalTaskAmount(makeTask({ type: 'task' }))).toBeUndefined();
  });

  it('uses only child fields for task-child matching, not the task uuid', () => {
    const child = { uuid: 'child-1', childName: 'Аня' };

    expect(getTaskChildKey(makeTask({ uuid: 'child-1' }))).toBeUndefined();
    expect(isTaskForChild(makeTask({ uuid: 'child-1' }), child)).toBe(false);
    expect(isTaskForChild(makeTask({ child_uuid: 'child-1' }), child)).toBe(true);
    expect(isTaskForChild(makeTask({ childId: 'child-1' }), child)).toBe(true);
    expect(isTaskForChild(makeTask({ childName: 'Аня' }), child)).toBe(true);
    expect(hasSameTaskChild(
      makeTask({ child_uuid: 'child-1' }),
      makeTask({ childId: 'child-1' }),
    )).toBe(true);
  });

  it('sorts tasks with explicit time before undated items', () => {
    const morning = makeTask({ time: '09:00' });
    const evening = makeTask({ time: '18:00' });
    const floating = makeTask({});

    expect([floating, evening, morning].sort(compareTasksByTime)).toEqual([morning, evening, floating]);
  });
});
