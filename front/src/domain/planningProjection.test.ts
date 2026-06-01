import { describe, expect, it } from 'vitest';
import type { Task } from '../services/api';
import {
  getLessonsWithoutIncome,
  getNextVisibleTasks,
  getOverdueTasks,
  getTaskMetrics,
  getTaskQueueProjection,
  getTasksForDate,
  getWeekMetrics,
} from './planningProjection';

const makeTask = (overrides: Partial<Task>): Task => ({
  uuid: 'task-1',
  title: 'Task',
  type: 'task',
  dueDate: '2026-06-01',
  ...overrides,
});

describe('planningProjection contract', () => {
  it('computes money, task and lesson metrics from mixed records', () => {
    const metrics = getTaskMetrics([
      makeTask({ uuid: 'income-1', type: 'income', amountEarned: 3000 }),
      makeTask({ uuid: 'expense-1', type: 'expense', amountSpent: 800 }),
      makeTask({ uuid: 'task-open', type: 'task', completed: false }),
      makeTask({ uuid: 'task-done', type: 'task', completed: true }),
      makeTask({ uuid: 'lesson-1', type: 'lesson' }),
    ]);

    expect(metrics).toEqual({
      income: 3000,
      expense: 800,
      tasks: 2,
      openTasks: 1,
      lessons: 1,
    });
  });

  it('projects a week without counting unrelated task ids as children', () => {
    const weekDays = [
      new Date(Date.UTC(2026, 5, 1)),
      new Date(Date.UTC(2026, 5, 2)),
    ];
    const metrics = getWeekMetrics([
      makeTask({ uuid: 'child-looks-like-task-id', type: 'task', dueDate: '2026-06-01' }),
      makeTask({ uuid: 'lesson-1', type: 'lesson', dueDate: '2026-06-02', child_uuid: 'child-1' }),
      makeTask({ uuid: 'income-1', type: 'income', dueDate: '2026-06-02', child_uuid: 'child-1', amountEarned: 1200 }),
    ], weekDays);

    expect(metrics.activeDays).toBe(2);
    expect(metrics.children).toBe(1);
    expect(metrics.income).toBe(1200);
  });

  it('finds actionable day and queue items by visible behavior', () => {
    const tasks = [
      makeTask({ uuid: 'floating', title: 'Floating', dueDate: '2026-06-01' }),
      makeTask({ uuid: 'timed', title: 'Timed', dueDate: '2026-06-01', time: '09:00' }),
      makeTask({ uuid: 'done', title: 'Done', dueDate: '2026-06-01', completed: true }),
      makeTask({ uuid: 'old', title: 'Old', dueDate: '2026-05-31', completed: false }),
    ];

    expect(getTasksForDate(tasks, new Date(Date.UTC(2026, 5, 1))).map((task) => task.uuid)).toEqual(['floating', 'timed', 'done']);
    expect(getNextVisibleTasks(tasks).map((task) => task.uuid)).toEqual(['timed', 'floating', 'old']);
    expect(getOverdueTasks(tasks, '2026-06-01').map((task) => task.uuid)).toEqual(['old']);

    const queue = getTaskQueueProjection(tasks, '2026-06-01');
    expect(queue.focusTask?.uuid).toBe('old');
    expect(queue.actionTasks.map((task) => task.uuid)).toEqual(['old', 'floating', 'timed']);
    expect(queue.completedTasks.map((task) => task.uuid)).toEqual(['done']);
  });

  it('identifies lessons that do not have a matching income record', () => {
    const tasks = [
      makeTask({ uuid: 'lesson-paid', type: 'lesson', time: '10:00', child_uuid: 'child-1' }),
      makeTask({ uuid: 'income-paid', type: 'income', time: '10:30', child_uuid: 'child-1', amountEarned: 1000 }),
      makeTask({ uuid: 'lesson-unpaid', type: 'lesson', time: '09:00', child_uuid: 'child-2' }),
    ];

    expect(getLessonsWithoutIncome(tasks).map((task) => task.uuid)).toEqual(['lesson-unpaid']);
  });
});
