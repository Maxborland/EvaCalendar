import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '../components/NavigationBar';
import TopNavigator from '../components/TopNavigator';
import CoreStateNotice from '../components/CoreStateNotice';
import { getTaskQueueProjection, getTaskStatusLabel } from '../domain/planningProjection';
import { useCreateTaskModal } from '../hooks/useCreateTaskModal';
import { useTasks, useUpdateTask } from '../hooks/useTasks';
import type { Task } from '../services/api';
import { formatDateToYYYYMMDD } from '../utils/dateUtils';

const getTodayDateString = () => {
  const now = new Date();
  return formatDateToYYYYMMDD(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
};

const getDateOffsetString = (daysOffset: number) => {
  const now = new Date();
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + daysOffset));
  return formatDateToYYYYMMDD(date);
};

interface TaskQueueCardProps {
  task: Task;
  today: string;
  isMutating: boolean;
  onOpenDay: (date: string) => void;
  onComplete: (uuid: string) => void;
}

const TaskQueueCard = ({ task, today, isMutating, onOpenDay, onComplete }: TaskQueueCardProps) => {
  const isOverdue = task.dueDate < today;

  return (
    <article className="rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-glass">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="m-0 text-base font-semibold truncate">{task.title}</h3>
          <p className="m-0 mt-1 text-sm text-text-tertiary">
            {task.dueDate}{task.time ? ` · ${task.time}` : ''}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
          isOverdue
            ? 'border border-expense-border bg-expense-bg text-expense-primary'
            : 'border border-[var(--color-task-border)] bg-[var(--color-task-bg)] text-[var(--color-task-primary)]'
        }`}>
          {getTaskStatusLabel(task, today)}
        </span>
      </div>
      {task.assignee_username && (
        <div className="mt-3 text-sm text-text-secondary">
          <span className="material-icons text-[16px] align-[-3px] mr-1">person</span>{task.assignee_username}
        </div>
      )}
      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          className="min-h-11 rounded-xl border border-[var(--color-task-border)] bg-[var(--color-task-bg)] text-[var(--color-task-primary)] text-sm font-semibold inline-flex items-center justify-center gap-1.5 active:scale-[0.98]"
          onClick={() => onOpenDay(task.dueDate)}
        >
          <span className="material-icons text-[18px]" aria-hidden="true">edit_note</span>
          День
        </button>
        <button
          type="button"
          className="size-11 rounded-xl border border-income-border bg-income-bg text-income-primary inline-flex items-center justify-center active:scale-[0.98] disabled:opacity-50"
          onClick={() => onComplete(task.uuid)}
          disabled={isMutating}
          aria-label="Закрыть задачу"
        >
          <span className="material-icons text-[20px]" aria-hidden="true">check</span>
        </button>
      </div>
    </article>
  );
};

const TasksPage = () => {
  const navigate = useNavigate();
  const { openCreateModal, createModalElement } = useCreateTaskModal();
  const tasksQuery = useTasks();
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const isLoading = tasksQuery.isLoading && !tasksQuery.data;
  const hasInitialTasksError = tasksQuery.isError && tasks.length === 0;
  const updateTaskMutation = useUpdateTask();
  const today = getTodayDateString();

  const taskMetrics = useMemo(() => getTaskQueueProjection(tasks, today), [tasks, today]);
  const { actionTasks, laterTasks, focusTask } = taskMetrics;

  const openCreateTask = (dueDate = today) => {
    openCreateModal('task', { dueDate });
  };

  const completeTask = (uuid: string) => {
    updateTaskMutation.mutate({ uuid, data: { completed: true } });
  };

  const openTaskDay = (date: string) => {
    navigate(`/day/${date}`);
  };

  return (
    <div className="min-h-dvh flex flex-col bg-surface-app text-text-primary">
      <TopNavigator title="Задачи" showButtons={false} />
      <main className="flex-1 flex flex-col gap-4 p-4 pb-[calc(96px+env(safe-area-inset-bottom))] max-[360px]:p-3 max-[360px]:pb-[calc(92px+env(safe-area-inset-bottom))]">
        <section className="grid grid-cols-4 gap-2 max-[360px]:grid-cols-2">
          <div className="rounded-2xl border border-[var(--color-task-border)] bg-[var(--color-task-bg)] p-3">
            <div className="text-xs text-text-secondary">Открыто</div>
            <div className="mt-1 text-2xl font-bold text-[var(--color-task-primary)]">{taskMetrics.openTasks.length}</div>
          </div>
          <div className="rounded-2xl border border-expense-border bg-expense-bg p-3">
            <div className="text-xs text-text-secondary">Просрочено</div>
            <div className="mt-1 text-2xl font-bold text-expense-primary">{taskMetrics.overdue.length}</div>
          </div>
          <div className="rounded-2xl border border-income-border bg-income-bg p-3">
            <div className="text-xs text-text-secondary">Сегодня</div>
            <div className="mt-1 text-2xl font-bold text-income-primary">{taskMetrics.todayTasks.length}</div>
          </div>
          <div className="rounded-2xl border border-border-subtle bg-surface-raised p-3">
            <div className="text-xs text-text-secondary">Закрыто</div>
            <div className="mt-1 text-2xl font-bold text-text-primary">{taskMetrics.completedTasks.length}</div>
          </div>
        </section>

        <section className={`rounded-2xl border p-4 shadow-glass ${
          hasInitialTasksError
            ? 'border-expense-border bg-expense-bg'
            : taskMetrics.overdue.length > 0
            ? 'border-expense-border bg-expense-bg'
            : actionTasks.length > 0
              ? 'border-[var(--color-task-border)] bg-[var(--color-task-bg)]'
              : 'border-income-border bg-income-bg'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-text-secondary">
                {hasInitialTasksError ? 'Данные недоступны' : taskMetrics.overdue.length > 0 ? 'Фокус: просрочено' : actionTasks.length > 0 ? 'Фокус на сегодня' : 'Фокус чистый'}
              </div>
              <h2 className={`m-0 mt-1 text-lg font-semibold leading-tight ${
                hasInitialTasksError || taskMetrics.overdue.length > 0
                  ? 'text-expense-primary'
                  : actionTasks.length > 0
                    ? 'text-[var(--color-task-primary)]'
                    : 'text-income-primary'
              }`}>
                {hasInitialTasksError ? 'Не удалось загрузить задачи' : focusTask ? focusTask.title : 'Нет задач, которые требуют действия'}
              </h2>
              <p className="m-0 mt-1 text-sm text-text-secondary">
                {hasInitialTasksError
                  ? 'Повторите загрузку, чтобы увидеть просроченные и сегодняшние дела.'
                  : focusTask
                  ? `${focusTask.dueDate}${focusTask.time ? ` · ${focusTask.time}` : ''}`
                  : 'Можно спокойно планировать следующие дела.'}
              </p>
            </div>
            {hasInitialTasksError ? (
              <button
                type="button"
                className="shrink-0 size-11 rounded-xl border border-expense-border bg-surface-raised text-expense-primary inline-flex items-center justify-center active:scale-[0.98]"
                onClick={() => tasksQuery.refetch()}
                aria-label="Повторить загрузку задач"
              >
                <span className="material-icons text-[20px]" aria-hidden="true">refresh</span>
              </button>
            ) : focusTask ? (
              <div className="shrink-0 flex gap-2">
                <button
                  type="button"
                  className="size-11 rounded-xl border border-[var(--color-task-border)] bg-surface-raised text-[var(--color-task-primary)] inline-flex items-center justify-center active:scale-[0.98]"
                  onClick={() => openTaskDay(focusTask.dueDate)}
                  aria-label="Открыть день фокусной задачи"
                >
                  <span className="material-icons text-[20px]" aria-hidden="true">event_note</span>
                </button>
                <button
                  type="button"
                  className="size-11 rounded-xl border border-income-border bg-income-bg text-income-primary inline-flex items-center justify-center active:scale-[0.98] disabled:opacity-50"
                  onClick={() => completeTask(focusTask.uuid)}
                  disabled={updateTaskMutation.isPending}
                  aria-label="Закрыть фокусную задачу"
                >
                  <span className="material-icons text-[20px]" aria-hidden="true">check</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="shrink-0 size-11 rounded-xl border border-[var(--color-task-border)] bg-[var(--color-task-bg)] text-[var(--color-task-primary)] inline-flex items-center justify-center active:scale-[0.98]"
                onClick={() => openCreateTask()}
                aria-label="Добавить задачу"
              >
                <span className="material-icons text-[20px]" aria-hidden="true">add_task</span>
              </button>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="min-h-11 rounded-xl border border-[var(--color-task-border)] bg-surface-raised text-[var(--color-task-primary)] text-sm font-semibold inline-flex items-center justify-center gap-1.5 active:scale-[0.98]"
              onClick={() => openCreateTask(today)}
            >
              <span className="material-icons text-[18px]" aria-hidden="true">today</span>
              На сегодня
            </button>
            <button
              type="button"
              className="min-h-11 rounded-xl border border-border-subtle bg-surface-raised text-text-primary text-sm font-semibold inline-flex items-center justify-center gap-1.5 active:scale-[0.98]"
              onClick={() => openCreateTask(getDateOffsetString(1))}
            >
              <span className="material-icons text-[18px] text-text-tertiary" aria-hidden="true">event</span>
              На завтра
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          {isLoading ? (
            <CoreStateNotice
              tone="loading"
              title="Загружаю задачи"
              description="Проверяю просроченные, сегодняшние и будущие дела."
            />
          ) : hasInitialTasksError ? (
            <CoreStateNotice
              tone="error"
              title="Не удалось загрузить задачи"
              description="Не показываю пустой список как факт, потому что задачи не пришли с сервера."
              actionLabel="Повторить загрузку"
              onAction={() => tasksQuery.refetch()}
            />
          ) : actionTasks.length > 0 || laterTasks.length > 0 ? (
            <>
              {actionTasks.length > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <h2 className="m-0 text-base font-semibold text-text-primary">Требуют действия</h2>
                  <span className="text-xs text-text-tertiary">{actionTasks.length}</span>
                </div>
              )}
              {actionTasks.slice(0, 8).map((task) => {
                return (
                  <TaskQueueCard
                    key={task.uuid}
                    task={task}
                    today={today}
                    isMutating={updateTaskMutation.isPending}
                    onOpenDay={openTaskDay}
                    onComplete={completeTask}
                  />
                );
              })}

              {laterTasks.length > 0 && (
                <div className="mt-1 flex items-center justify-between gap-3">
                  <h2 className="m-0 text-base font-semibold text-text-primary">Позже</h2>
                  <span className="text-xs text-text-tertiary">{laterTasks.length}</span>
                </div>
              )}
              {laterTasks.map((task) => (
                <TaskQueueCard
                  key={task.uuid}
                  task={task}
                  today={today}
                  isMutating={updateTaskMutation.isPending}
                  onOpenDay={openTaskDay}
                  onComplete={completeTask}
                />
              ))}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--color-task-border)] bg-[var(--color-task-bg)] p-5">
              <div className="flex items-start gap-3">
                <div className="size-11 shrink-0 rounded-xl border border-[var(--color-task-border)] bg-surface-raised text-[var(--color-task-primary)] inline-flex items-center justify-center">
                  <span className="material-icons text-[22px]" aria-hidden="true">task_alt</span>
                </div>
                <div className="min-w-0">
                  <h2 className="m-0 text-lg font-semibold leading-tight text-[var(--color-task-primary)]">
                    Список задач пуст
                  </h2>
                  <p className="m-0 mt-1 text-sm leading-snug text-text-secondary">
                    Добавьте первое дело на сегодня или завтра, чтобы оно попало в фокус дня.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="min-h-11 rounded-xl border border-[var(--color-task-border)] bg-surface-raised text-[var(--color-task-primary)] px-3 text-sm font-semibold inline-flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  onClick={() => openCreateTask(today)}
                >
                  <span className="material-icons text-[18px]" aria-hidden="true">today</span>
                  На сегодня
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-xl border border-border-subtle bg-surface-raised text-text-primary px-3 text-sm font-semibold inline-flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  onClick={() => openCreateTask(getDateOffsetString(1))}
                >
                  <span className="material-icons text-[18px] text-text-tertiary" aria-hidden="true">event</span>
                  На завтра
                </button>
              </div>
              <button
                type="button"
                className="mt-2 min-h-11 w-full rounded-xl border border-transparent bg-transparent text-text-secondary px-3 text-sm font-semibold inline-flex items-center justify-center gap-1.5 active:scale-[0.98]"
                onClick={() => navigate('/')}
              >
                <span className="material-icons text-[18px]" aria-hidden="true">view_week</span>
                Открыть план недели
              </button>
            </div>
          )}
        </section>
      </main>
      <NavigationBar onCreateClick={() => openCreateTask()} />
      {createModalElement}
    </div>
  );
};

export default TasksPage;
