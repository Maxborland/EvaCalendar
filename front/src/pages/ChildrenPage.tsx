import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '../components/NavigationBar';
import TopNavigator from '../components/TopNavigator';
import CoreStateNotice from '../components/CoreStateNotice';
import { getCurrentPeriodRange, getTodayDateString } from '../domain/datePeriod';
import { formatMoneyNumber, formatSignedRubles } from '../domain/moneyFormat';
import { getTaskAmount, isIncomeTask, isTaskForChild } from '../domain/taskRecord';
import { useChildren } from '../hooks/useChildren';
import { useCreateTaskModal } from '../hooks/useCreateTaskModal';
import { useTasks } from '../hooks/useTasks';
import type { Child, Task } from '../services/api';

const isLessonForChild = (task: Task, child: Child) =>
  task.type === 'lesson' &&
  (
    isTaskForChild(task, child) ||
    task.title.toLowerCase().includes(child.childName.toLowerCase()) ||
    task.comments?.toLowerCase().includes(child.childName.toLowerCase())
  );

const getTaskSortValue = (task: Task) => `${task.dueDate} ${task.time || '99:99'} ${task.title}`;

const getChildNameForTask = (task: Task, children: Child[]) => {
  if (task.childName) return task.childName;
  const childUuid = task.child_uuid || task.childId;
  return children.find((child) => child.uuid === childUuid)?.childName || 'Без ребенка';
};

const ChildrenPage = () => {
  const navigate = useNavigate();
  const { openCreateModal, createModalElement } = useCreateTaskModal();
  const childrenQuery = useChildren();
  const tasksQuery = useTasks();
  const children = useMemo(() => childrenQuery.data ?? [], [childrenQuery.data]);
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const isLoading = childrenQuery.isLoading && !childrenQuery.data;
  const hasInitialChildrenError = childrenQuery.isError && children.length === 0;
  const hasChildTimelineError = tasksQuery.isError && tasks.length === 0;

  const today = getTodayDateString();
  const { start: monthStart, end: monthEnd } = getCurrentPeriodRange('month');

  const childInsights = useMemo(() => {
    return new Map(children.map((child) => {
      const monthIncome = tasks
        .filter((task) => isIncomeTask(task) && task.dueDate >= monthStart && task.dueDate <= monthEnd && isTaskForChild(task, child))
        .reduce((sum, task) => sum + getTaskAmount(task), 0);

      const nextLesson = tasks
        .filter((task) => isLessonForChild(task, child) && task.dueDate >= today)
        .sort((a, b) => `${a.dueDate} ${a.time || '99:99'}`.localeCompare(`${b.dueDate} ${b.time || '99:99'}`))[0];

      return [child.uuid, { monthIncome, nextLesson }];
    }));
  }, [children, monthEnd, monthStart, tasks, today]);

  const childrenOverview = useMemo(() => {
    const totalMonthIncome = children.reduce(
      (sum, child) => sum + (childInsights.get(child.uuid)?.monthIncome ?? 0),
      0,
    );

    const upcomingLessons = tasks
      .filter((task) => task.type === 'lesson' && task.dueDate >= today && children.some((child) => isLessonForChild(task, child)))
      .sort((a, b) => getTaskSortValue(a).localeCompare(getTaskSortValue(b)));

    const todayChildItems = tasks
      .filter((task) => task.dueDate === today)
      .filter((task) => task.type === 'lesson' || isIncomeTask(task))
      .filter((task) => children.some((child) => isTaskForChild(task, child) || isLessonForChild(task, child)))
      .sort((a, b) => getTaskSortValue(a).localeCompare(getTaskSortValue(b)))
      .slice(0, 5);

    return {
      totalMonthIncome,
      todayLessons: upcomingLessons.filter((task) => task.dueDate === today).length,
      nextLesson: upcomingLessons[0],
      todayChildItems,
    };
  }, [childInsights, children, tasks, today]);

  const sortedChildren = useMemo(() => {
    return [...children].sort((left, right) => {
      const leftNextLesson = childInsights.get(left.uuid)?.nextLesson;
      const rightNextLesson = childInsights.get(right.uuid)?.nextLesson;
      const leftIsToday = leftNextLesson?.dueDate === today ? 0 : 1;
      const rightIsToday = rightNextLesson?.dueDate === today ? 0 : 1;
      if (leftIsToday !== rightIsToday) return leftIsToday - rightIsToday;
      const lessonCompare = (leftNextLesson ? getTaskSortValue(leftNextLesson) : '9999')
        .localeCompare(rightNextLesson ? getTaskSortValue(rightNextLesson) : '9999');
      if (lessonCompare !== 0) return lessonCompare;
      return left.childName.localeCompare(right.childName);
    });
  }, [childInsights, children, today]);

  const openIncomeForChild = (child: Child) => {
    openCreateModal('income', {
      title: `Оплата: ${child.childName}`,
      childId: child.uuid,
      child_uuid: child.uuid,
      childName: child.childName,
      hourlyRate: child.hourlyRate ?? undefined,
      address: child.address || undefined,
    });
  };

  const openLessonForChild = (child: Child) => {
    openCreateModal('lesson', {
      title: `Занятие: ${child.childName}`,
      childId: child.uuid,
      child_uuid: child.uuid,
      childName: child.childName,
      address: child.address || undefined,
      comments: child.parentPhone ? `Родитель: ${child.parentName}, ${child.parentPhone}` : `Родитель: ${child.parentName}`,
    });
  };

  const openPrimaryChildCreate = () => {
    const primaryChild = sortedChildren[0];
    if (primaryChild) {
      openLessonForChild(primaryChild);
      return;
    }
    navigate('/settings/child-cards');
  };

  return (
    <div className="min-h-dvh flex flex-col bg-surface-app text-text-primary">
      <TopNavigator title="Дети" showButtons={false} />
      <main className="eva-screen eva-screen--with-nav flex-1 flex flex-col gap-4 p-4 pb-[calc(96px+env(safe-area-inset-bottom))] max-[360px]:p-3 max-[360px]:pb-[calc(92px+env(safe-area-inset-bottom))]">
        <section className="rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-glass">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-lg font-semibold">Карточки детей</h2>
              <p className="m-0 mt-1 text-sm text-text-tertiary">Ставки, адреса и контакты для доходов и занятий</p>
            </div>
            <button
              type="button"
              className="h-11 min-w-[44px] rounded-xl border border-income-border bg-income-bg text-income-primary inline-flex items-center justify-center active:scale-95 [&_.material-icons]:text-[22px]"
              onClick={() => navigate('/settings/child-cards')}
              aria-label="Управлять детьми"
            >
              <span className="material-icons" aria-hidden="true">edit</span>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="min-w-0 rounded-xl border border-border-subtle bg-surface-elevated p-3">
              <div className="text-[0.6875rem] text-text-secondary">Дети</div>
              <div className="mt-1 text-xl font-bold text-text-primary">{hasInitialChildrenError ? '—' : children.length}</div>
            </div>
            <div className="min-w-0 rounded-xl border border-[var(--color-lesson-border)] bg-[var(--color-lesson-bg)] p-3">
              <div className="text-[0.6875rem] text-text-secondary">Сегодня</div>
              <div className="mt-1 text-xl font-bold text-[var(--color-lesson-primary)]">{hasInitialChildrenError || hasChildTimelineError ? '—' : childrenOverview.todayLessons}</div>
            </div>
            <div className="min-w-0 rounded-xl border border-income-border bg-income-bg p-3">
              <div className="text-[0.6875rem] text-text-secondary">Доход</div>
              <div className="mt-1 text-sm font-bold text-income-primary truncate">{hasInitialChildrenError || hasChildTimelineError ? '—' : formatSignedRubles(childrenOverview.totalMonthIncome)}</div>
            </div>
          </div>

          <button
            type="button"
            className="mt-3 w-full rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2 text-left grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 active:scale-[0.99]"
            onClick={() => childrenOverview.nextLesson ? navigate(`/day/${childrenOverview.nextLesson.dueDate}`) : navigate('/')}
          >
            <span className="material-icons text-[19px] text-[var(--color-lesson-primary)]" aria-hidden="true">school</span>
            <span className="min-w-0">
              <span className="block text-xs text-text-tertiary">Ближайшее занятие</span>
              <span className="block truncate text-sm font-semibold text-text-primary">
                {childrenOverview.nextLesson
                  ? `${childrenOverview.nextLesson.childName || childrenOverview.nextLesson.title} · ${childrenOverview.nextLesson.dueDate}${childrenOverview.nextLesson.time ? ` · ${childrenOverview.nextLesson.time}` : ''}`
                  : 'Не запланировано'}
              </span>
            </span>
            <span className="material-icons text-[18px] text-text-tertiary" aria-hidden="true">chevron_right</span>
          </button>

          <div className="mt-3 rounded-xl border border-border-subtle bg-surface-elevated p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="m-0 text-sm font-semibold text-text-primary">Сегодня по детям</h3>
              <span className="text-xs text-text-tertiary">{childrenOverview.todayChildItems.length}</span>
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              {hasChildTimelineError ? (
                <CoreStateNotice
                  tone="error"
                  title="День по детям не загрузился"
                  description="Карточки доступны, но занятия и оплаты за сегодня не пришли."
                  actionLabel="Повторить"
                  onAction={() => tasksQuery.refetch()}
                  className="shadow-none"
                />
              ) : childrenOverview.todayChildItems.length > 0 ? (
                childrenOverview.todayChildItems.map((task) => {
                  const isIncome = isIncomeTask(task);
                  const amount = getTaskAmount(task);
                  return (
                    <button
                      key={task.uuid}
                      type="button"
                      className="min-h-11 rounded-xl border border-border-subtle bg-surface-raised px-3 py-2 text-left grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 active:scale-[0.99]"
                      onClick={() => navigate(`/day/${task.dueDate}`)}
                    >
                      <span className={`size-8 rounded-lg border inline-flex items-center justify-center ${
                        isIncome
                          ? 'border-income-border bg-income-bg text-income-primary'
                          : 'border-[var(--color-lesson-border)] bg-[var(--color-lesson-bg)] text-[var(--color-lesson-primary)]'
                      }`}>
                        <span className="material-icons text-[17px]" aria-hidden="true">{isIncome ? 'trending_up' : 'school'}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-text-primary">
                          {task.title || (isIncome ? 'Доход' : 'Занятие')}
                        </span>
                        <span className="block truncate text-[0.6875rem] text-text-tertiary">
                          {task.time || (isIncome ? 'Доход' : 'Занятие')} · {getChildNameForTask(task, children)}
                        </span>
                      </span>
                      {isIncome && amount > 0 ? (
                        <span className="shrink-0 text-xs font-bold text-income-primary">{formatSignedRubles(amount)}</span>
                      ) : (
                        <span className="material-icons text-[18px] text-text-tertiary" aria-hidden="true">chevron_right</span>
                      )}
                    </button>
                  );
                })
              ) : (
                <button
                  type="button"
                  className="min-h-11 rounded-xl border border-dashed border-border-strong px-3 py-2 text-left text-sm text-text-tertiary active:scale-[0.99]"
                  onClick={() => children[0] ? openLessonForChild(children[0]) : navigate('/settings/child-cards')}
                >
                  Сегодня занятий и оплат по детям нет
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          {isLoading ? (
            <CoreStateNotice
              tone="loading"
              title="Загружаю детей"
              description="Подтягиваю карточки, ставки, контакты и ближайшие занятия."
            />
          ) : hasInitialChildrenError ? (
            <CoreStateNotice
              tone="error"
              title="Не удалось загрузить детей"
              description="Не показываю пустой список как факт, потому что карточки не пришли с сервера."
              actionLabel="Повторить загрузку"
              onAction={() => childrenQuery.refetch()}
            />
          ) : children.length > 0 ? (
            sortedChildren.map((child) => {
              const insight = childInsights.get(child.uuid);
              const hasTodayLesson = insight?.nextLesson?.dueDate === today;
              return (
                <article key={child.uuid} className="rounded-2xl border border-border-subtle bg-surface-glass p-4 shadow-glass backdrop-blur-[14px]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="m-0 text-base font-semibold truncate">{child.childName}</h3>
                        {hasTodayLesson && (
                          <span className="shrink-0 rounded-full border border-[var(--color-lesson-border)] bg-[var(--color-lesson-bg)] px-2 py-0.5 text-[0.6875rem] font-semibold text-[var(--color-lesson-primary)]">
                            сегодня
                          </span>
                        )}
                      </div>
                      <p className="m-0 mt-1 text-sm text-text-secondary truncate">{child.parentName}</p>
                    </div>
                    <div className="shrink-0 rounded-xl border border-income-border bg-income-bg px-3 py-2 text-right">
                      <div className="text-[0.6875rem] text-text-secondary">Ставка</div>
                      <div className="text-sm font-bold text-income-primary">{child.hourlyRate ?? 0} ₽/ч</div>
                    </div>
                  </div>
                  {(child.address || child.parentPhone) && (
                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-text-tertiary">
                      {child.address && <div className="truncate"><span className="material-icons text-[16px] align-[-3px] mr-1">location_on</span>{child.address}</div>}
                      {child.parentPhone && <div className="truncate"><span className="material-icons text-[16px] align-[-3px] mr-1">call</span>{child.parentPhone}</div>}
                    </div>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="min-w-0 rounded-xl border border-income-border bg-income-bg p-3">
                      <div className="text-[0.6875rem] text-text-secondary">Доход месяца</div>
                      <div className="mt-1 text-sm font-bold text-income-primary truncate">+{formatMoneyNumber(insight?.monthIncome ?? 0)} ₽</div>
                    </div>
                    <button
                      type="button"
                      className="min-w-0 rounded-xl border border-[var(--color-lesson-border)] bg-[var(--color-lesson-bg)] p-3 text-left transition-all duration-[160ms] hover:-translate-y-px hover:shadow-elevation-1 active:scale-[0.99]"
                      onClick={() => insight?.nextLesson ? navigate(`/day/${insight.nextLesson.dueDate}`) : openLessonForChild(child)}
                    >
                      <div className="text-[0.6875rem] text-text-secondary">Ближайшее</div>
                      <div className="mt-1 text-sm font-bold text-[var(--color-lesson-primary)] truncate">
                        {insight?.nextLesson ? `${insight.nextLesson.dueDate}${insight.nextLesson.time ? ` · ${insight.nextLesson.time}` : ''}` : 'Нет занятия'}
                      </div>
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="eva-button eva-button--income"
                      onClick={() => openIncomeForChild(child)}
                    >
                      <span className="material-icons text-[18px]" aria-hidden="true">add_card</span>
                      Доход
                    </button>
                    <button
                      type="button"
                      className="eva-button eva-button--lesson"
                      onClick={() => openLessonForChild(child)}
                    >
                      <span className="material-icons text-[18px]" aria-hidden="true">school</span>
                      Занятие
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-income-border bg-income-bg p-5 text-left">
              <div className="flex items-start gap-3">
                <span className="shrink-0 size-10 rounded-xl border border-income-border bg-surface-raised text-income-primary inline-flex items-center justify-center">
                  <span className="material-icons text-[20px]" aria-hidden="true">person_add</span>
                </span>
                <div className="min-w-0">
                  <h2 className="m-0 text-base font-semibold text-text-primary">Добавьте первого ребенка</h2>
                  <p className="m-0 mt-1 text-sm text-text-secondary leading-snug">
                    Карточка хранит ставку и контакт, чтобы занятия и доходы создавались быстрее.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="mt-4 min-h-11 w-full rounded-xl border border-income-border bg-surface-raised text-income-primary px-4 text-sm font-semibold inline-flex items-center justify-center gap-1.5 active:scale-[0.98]"
                onClick={() => navigate('/settings/child-cards')}
              >
                <span className="material-icons text-[18px]" aria-hidden="true">add</span>
                Создать карточку
              </button>
            </div>
          )}
        </section>
      </main>
      <NavigationBar onCreateClick={openPrimaryChildCreate} />
      {createModalElement}
    </div>
  );
};

export default ChildrenPage;
