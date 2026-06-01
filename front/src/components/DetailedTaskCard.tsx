import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { formatMoneyNumber, formatRubles, formatSignedRubles } from '../domain/moneyFormat';
import { getOptionalTaskAmount, isExpenseTask, isIncomeTask } from '../domain/taskRecord';
import { type Task } from '../services/api';

interface DetailedTaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
  onCreateIncome?: (sourceTask: Task) => void;
  hasIncomeForLesson?: boolean;
  isMutating?: boolean;
}

const getTaskKind = (task: Task) => {
  if (isExpenseTask(task)) {
    return {
      label: 'Расход',
      icon: 'trending_down',
      className: 'border-expense-border bg-expense-bg text-expense-primary',
    };
  }
  if (isIncomeTask(task)) {
    return {
      label: 'Доход',
      icon: 'trending_up',
      className: 'border-income-border bg-income-bg text-income-primary',
    };
  }
  if (task.type === 'lesson') {
    return {
      label: 'Занятие',
      icon: 'school',
      className: 'border-[var(--color-lesson-border)] bg-[var(--color-lesson-bg)] text-[var(--color-lesson-primary)]',
    };
  }
  return {
    label: task.completed ? 'Готово' : 'Задача',
    icon: task.completed ? 'check_circle' : 'task_alt',
    className: task.completed
      ? 'border-income-border bg-income-bg text-income-primary'
      : 'border-[var(--color-task-border)] bg-[var(--color-task-bg)] text-[var(--color-task-primary)]',
  };
};

const DetailedTaskCard = ({
  task,
  onEdit,
  onDelete,
  onComplete,
  onCreateIncome,
  hasIncomeForLesson,
  isMutating,
}: DetailedTaskCardProps) => {
  const {
    uuid,
    title,
    type,
    time,
    childName,
    parentName,
    parentPhone,
    childAddress,
    childHourlyRate,
    assignee,
  } = task;

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  const handleEdit = () => onEdit(task);
  const handleDelete = useCallback(() => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      confirmTimerRef.current = setTimeout(() => setConfirmingDelete(false), 3000);
    } else {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      setConfirmingDelete(false);
      onDelete(uuid);
    }
  }, [confirmingDelete, onDelete, uuid]);

  let incomeDisplayValue: string | undefined;
  if (isIncomeTask(task)) {
    const displayAmount = getOptionalTaskAmount(task);
    if (displayAmount !== undefined) {
      incomeDisplayValue = formatSignedRubles(displayAmount);
    }
  }

  const showChildInfo = parentName || parentPhone || childAddress || childHourlyRate !== undefined;
  const taskKind = getTaskKind(task);
  const canComplete = type === 'task' && !task.completed && onComplete;
  const canCreateIncome = type === 'lesson' && onCreateIncome;

  return (
    <div className={clsx(
      'bg-surface-raised border border-border-subtle rounded-2xl p-4 shadow-glass transition-all duration-[180ms] ease-linear hover:border-border-strong hover:shadow-elevation-2 hover:-translate-y-0.5',
      task.completed && 'opacity-75',
    )}>
      <div className="flex justify-between items-start gap-3 mb-4 pb-3 border-b border-border-subtle">
        <div className="min-w-0 flex-1">
          <div className={clsx('mb-2 inline-flex min-h-7 items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-semibold', taskKind.className)}>
            <span className="material-icons text-[15px]" aria-hidden="true">{taskKind.icon}</span>
            <span>{taskKind.label}</span>
          </div>
          <h2 className="m-0 text-lg font-semibold leading-tight text-text-primary break-words">{title || 'Название задачи'}</h2>
        </div>
        <div className="flex gap-2 shrink-0">
          {canComplete && (
            <button
              onClick={() => onComplete(uuid)}
              disabled={isMutating}
              className="inline-flex items-center justify-center size-11 rounded-[10px] border border-income-border bg-income-bg text-income-primary cursor-pointer transition-all duration-[160ms] ease-linear hover:-translate-y-px disabled:opacity-50"
              aria-label="Закрыть задачу"
            >
              <span className="material-icons text-[20px]">check</span>
            </button>
          )}
          <button
            onClick={handleEdit}
            className="inline-flex items-center justify-center size-11 rounded-[10px] border border-border-subtle bg-[rgba(255,255,255,0.04)] text-text-primary cursor-pointer transition-all duration-[160ms] ease-linear hover:-translate-y-px hover:border-border-strong hover:bg-income-bg hover:border-income-border hover:text-income-primary"
            aria-label="Редактировать"
          >
            <span className="material-icons text-[20px]">edit</span>
          </button>
          <button
            onClick={handleDelete}
            className={clsx(
              'inline-flex items-center justify-center size-11 rounded-[10px] border cursor-pointer transition-all duration-[160ms] ease-linear',
              confirmingDelete
                ? 'w-auto px-3 bg-[rgba(224,86,86,0.22)] border-[rgba(224,86,86,0.4)] text-[#ffb3b8]'
                : 'border-border-subtle bg-[rgba(255,255,255,0.04)] text-text-primary hover:-translate-y-px hover:border-border-strong hover:bg-expense-bg hover:border-expense-border hover:text-expense-primary'
            )}
            aria-label={confirmingDelete ? 'Точно удалить?' : 'Удалить'}
          >
            {confirmingDelete ? (
              <span className="text-xs font-semibold whitespace-nowrap">Точно?</span>
            ) : (
              <span className="material-icons text-[20px]">delete</span>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {time && (
          <div className="flex items-start gap-2">
            <span className="material-icons shrink-0 text-[20px] text-text-secondary mt-0.5">schedule</span>
            <p className="m-0 text-base leading-normal text-text-primary"><span className="font-medium text-text-primary mr-1">Время:</span> {time}</p>
          </div>
        )}

        {childName && (
          <div className="flex items-start gap-2">
            <span className="material-icons shrink-0 text-[20px] text-text-secondary mt-0.5">child_care</span>
            <p className="m-0 text-base leading-normal text-text-primary"><span className="font-medium text-text-primary mr-1">Ребенок:</span> {childName}</p>
          </div>
        )}

        {type === 'lesson' && task.address && (
          <div className="flex items-start gap-2">
            <span className="material-icons shrink-0 text-[20px] text-lesson-primary mt-0.5">location_on</span>
            <p className="m-0 text-base leading-normal text-text-primary"><span className="font-medium text-text-primary mr-1">Адрес:</span> {task.address}</p>
          </div>
        )}

        {type === 'lesson' && (
          <div className="flex items-start gap-2">
            <span className="material-icons shrink-0 text-[20px] text-lesson-primary mt-0.5">school</span>
            <p className="m-0 text-base leading-normal text-text-primary"><span className="font-medium text-text-primary mr-1">Тип:</span> Занятие</p>
          </div>
        )}

        {type === 'lesson' && hasIncomeForLesson && (
          <div className="rounded-xl border border-income-border bg-income-bg px-3 py-2 text-sm font-medium text-income-primary inline-flex items-center gap-2">
            <span className="material-icons text-[18px]" aria-hidden="true">check_circle</span>
            <span>Доход за день уже внесен</span>
          </div>
        )}

        {canCreateIncome && (
          <button
            type="button"
            className={clsx(
              'mt-1 min-h-12 rounded-xl border px-3 text-sm font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98]',
              hasIncomeForLesson
                ? 'border-border-subtle bg-surface-muted text-text-secondary'
                : 'border-income-border bg-income-bg text-income-primary',
            )}
            onClick={() => onCreateIncome(task)}
          >
            <span className="material-icons text-[19px]" aria-hidden="true">add_card</span>
            <span className="truncate">
              {hasIncomeForLesson
                ? 'Добавить еще доход'
                : childHourlyRate
                  ? `Доход: ${formatMoneyNumber(childHourlyRate)} ₽/ч`
                  : 'Создать доход'}
            </span>
          </button>
        )}

        {type === 'task' && assignee && (
          <div className="flex items-start gap-2">
            <span className="material-icons shrink-0 text-[20px] text-text-secondary mt-0.5">assignment_ind</span>
            <p className="m-0 text-base leading-normal text-text-primary"><span className="font-medium text-text-primary mr-1">Исполнитель:</span> {assignee.username}</p>
          </div>
        )}

        {isIncomeTask(task) && incomeDisplayValue && (
          <div className="flex items-start gap-2">
            <span className="material-icons shrink-0 text-[20px] text-income-primary mt-0.5">trending_up</span>
            <p className="m-0 text-base leading-normal text-text-primary"><span className="font-medium text-text-primary mr-1">Доход:</span> <span className="font-semibold text-income-primary">{incomeDisplayValue}</span></p>
          </div>
        )}

        {isExpenseTask(task) && getOptionalTaskAmount(task) !== undefined && (
            <div className="flex items-start gap-2">
                <span className="material-icons shrink-0 text-[20px] text-expense-primary mt-0.5">trending_down</span>
                <p className="m-0 text-base leading-normal text-text-primary"><span className="font-medium text-text-primary mr-1">Расход:</span> <span className="font-semibold text-expense-primary">-{formatRubles(getOptionalTaskAmount(task) ?? 0)}</span></p>
            </div>
        )}

        {type === 'lesson' && task.comments && (
          <div className="mt-3 pt-3 border-t border-border-subtle">
            <h3 className="m-0 mb-3 text-lg font-semibold text-text-primary leading-tight">Заметки:</h3>
            <div className="p-3 rounded-xl bg-surface-muted border border-border-subtle">
              <p className="m-0 text-sm leading-normal text-text-secondary whitespace-pre-wrap">{task.comments}</p>
            </div>
          </div>
        )}

        {showChildInfo && (
          <div className="mt-3 pt-3 border-t border-border-subtle">
            <h3 className="m-0 mb-3 text-lg font-semibold text-text-primary leading-tight">Информация о ребенке:</h3>

            {parentName && (
              <div className="flex items-start gap-2">
                <span className="material-icons shrink-0 text-[20px] text-text-secondary mt-0.5">person</span>
                <p className="m-0 text-base leading-normal text-text-primary"><span className="font-medium text-text-primary mr-1">Имя родителя:</span> {parentName}</p>
              </div>
            )}

            {parentPhone && (
              <div className="flex items-start gap-2">
                <span className="material-icons shrink-0 text-[20px] text-text-secondary mt-0.5">phone</span>
                <p className="m-0 text-base leading-normal text-text-primary"><span className="font-medium text-text-primary mr-1">Телефон:</span> {parentPhone}</p>
              </div>
            )}

            {childAddress && (
              <div className="flex items-start gap-2">
                <span className="material-icons shrink-0 text-[20px] text-text-secondary mt-0.5">location_on</span>
                <p className="m-0 text-base leading-normal text-text-primary"><span className="font-medium text-text-primary mr-1">Адрес:</span> {childAddress}</p>
              </div>
            )}

            {childHourlyRate !== undefined && (
              <div className="flex items-start gap-2">
                <span className="material-icons shrink-0 text-[20px] text-text-secondary mt-0.5">payments</span>
                <p className="m-0 text-base leading-normal text-text-primary"><span className="font-medium text-text-primary mr-1">Ставка:</span> {childHourlyRate} ₽/час</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailedTaskCard;
