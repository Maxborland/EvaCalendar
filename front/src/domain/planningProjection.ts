import type { Task } from '../services/api';
import { createDate, isSameDay } from '../utils/dateUtils';
import {
  compareTasksByTime,
  getTaskAmount,
  getTaskChildKey,
  getTaskTimeRank,
  hasSameTaskChild,
  isIncomeTask,
} from './taskRecord';

export interface TaskMetrics {
  income: number;
  expense: number;
  tasks: number;
  openTasks: number;
  lessons: number;
}

export interface WeekMetrics extends TaskMetrics {
  activeDays: number;
  children: number;
}

export const emptyTaskMetrics = (): TaskMetrics => ({
  income: 0,
  expense: 0,
  tasks: 0,
  openTasks: 0,
  lessons: 0,
});

export const getTaskMetrics = (tasks: Task[]): TaskMetrics =>
  tasks.reduce((acc, task) => {
    if (task.type === 'expense') {
      acc.expense += getTaskAmount(task);
    } else if (isIncomeTask(task)) {
      acc.income += getTaskAmount(task);
    } else if (task.type === 'task') {
      acc.tasks += 1;
      if (!task.completed) acc.openTasks += 1;
    } else if (task.type === 'lesson') {
      acc.lessons += 1;
    }
    return acc;
  }, emptyTaskMetrics());

export const getTasksForDate = (tasks: Task[], targetDate: Date) =>
  tasks.filter((task) => isSameDay(createDate(task.dueDate), targetDate));

export const getNextVisibleTasks = (tasks: Task[], limit = 3) =>
  [...tasks]
    .filter((task) => !(task.type === 'task' && task.completed))
    .sort((left, right) => {
      const timeCompare = getTaskTimeRank(left).localeCompare(getTaskTimeRank(right));
      if (timeCompare !== 0) return timeCompare;
      return left.title.localeCompare(right.title);
    })
    .slice(0, limit);

export const getOverdueTasks = (tasks: Task[], todayDateString: string) =>
  tasks
    .filter((task) => task.type === 'task' && !task.completed && task.dueDate < todayDateString)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate));

export const getLessonsWithoutIncome = (tasks: Task[]) =>
  tasks
    .filter((task) => task.type === 'lesson')
    .filter((lesson) => !tasks.some((task) => task.uuid !== lesson.uuid && isIncomeTask(task) && hasSameTaskChild(task, lesson)))
    .sort(compareTasksByTime);

export const getWeekMetrics = (tasks: Task[], weekDays: Date[]): WeekMetrics => {
  const childKeys = new Set<string>();
  return weekDays.reduce<WeekMetrics>((acc, day) => {
    const dayTasks = getTasksForDate(tasks, day);
    if (dayTasks.length > 0) acc.activeDays += 1;

    dayTasks.forEach((task) => {
      const childKey = getTaskChildKey(task);
      if (childKey) childKeys.add(childKey);
    });

    const dayMetrics = getTaskMetrics(dayTasks);
    acc.income += dayMetrics.income;
    acc.expense += dayMetrics.expense;
    acc.tasks += dayMetrics.tasks;
    acc.openTasks += dayMetrics.openTasks;
    acc.lessons += dayMetrics.lessons;
    acc.children = childKeys.size;
    return acc;
  }, { ...emptyTaskMetrics(), activeDays: 0, children: 0 });
};

export const sortTasksByDueDate = (left: Task, right: Task) => {
  const dateCompare = createDate(left.dueDate).getTime() - createDate(right.dueDate).getTime();
  if (dateCompare !== 0) return dateCompare;
  return (left.time || '').localeCompare(right.time || '');
};

export const getTaskStatusLabel = (task: Task, today: string) => {
  if (task.dueDate < today) return 'Просрочено';
  if (task.dueDate === today) return 'Сегодня';
  return 'Позже';
};

export const getTaskQueueProjection = (tasks: Task[], today: string) => {
  const taskItems = tasks.filter((task) => task.type === 'task');
  const openTasks = taskItems.filter((task) => !task.completed);
  const completedTasks = taskItems.filter((task) => task.completed);
  const overdue = openTasks.filter((task) => task.dueDate && task.dueDate < today);
  const todayTasks = openTasks.filter((task) => task.dueDate === today);
  const actionTasks = [...overdue, ...todayTasks]
    .filter((task, index, list) => list.findIndex((item) => item.uuid === task.uuid) === index)
    .sort(sortTasksByDueDate);
  const actionTaskIds = new Set(actionTasks.map((task) => task.uuid));
  const laterTasks = openTasks
    .filter((task) => !actionTaskIds.has(task.uuid))
    .sort(sortTasksByDueDate)
    .slice(0, 8);

  return {
    taskItems,
    openTasks,
    completedTasks,
    overdue,
    todayTasks,
    actionTasks,
    laterTasks,
    focusTask: actionTasks[0],
  };
};
