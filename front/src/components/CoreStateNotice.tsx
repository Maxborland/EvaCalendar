import clsx from 'clsx';

type CoreStateNoticeTone = 'loading' | 'error' | 'info';

interface CoreStateNoticeProps {
  tone: CoreStateNoticeTone;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const toneStyles: Record<CoreStateNoticeTone, { icon: string; className: string; iconClassName: string }> = {
  loading: {
    icon: 'sync',
    className: 'border-border-subtle bg-surface-raised text-text-primary',
    iconClassName: 'text-text-tertiary animate-spin',
  },
  error: {
    icon: 'cloud_off',
    className: 'border-expense-border bg-expense-bg text-expense-primary',
    iconClassName: 'text-expense-primary',
  },
  info: {
    icon: 'info',
    className: 'border-income-border bg-income-bg text-income-primary',
    iconClassName: 'text-income-primary',
  },
};

const CoreStateNotice = ({
  tone,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: CoreStateNoticeProps) => {
  const styles = toneStyles[tone];

  return (
    <section
      className={clsx('rounded-2xl border p-4 shadow-glass', styles.className, className)}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start gap-3">
        <span className="size-11 shrink-0 rounded-xl border border-current/25 bg-surface-raised inline-flex items-center justify-center">
          <span className={clsx('material-icons text-[22px]', styles.iconClassName)} aria-hidden="true">
            {styles.icon}
          </span>
        </span>
        <div className="min-w-0">
          <h2 className="m-0 text-base font-semibold leading-tight">{title}</h2>
          <p className="m-0 mt-1 text-sm leading-snug text-text-secondary">{description}</p>
        </div>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          className="mt-4 min-h-11 w-full rounded-xl border border-current/25 bg-surface-raised px-3 text-sm font-semibold inline-flex items-center justify-center gap-1.5 active:scale-[0.98]"
          onClick={onAction}
        >
          <span className="material-icons text-[18px]" aria-hidden="true">refresh</span>
          {actionLabel}
        </button>
      )}
    </section>
  );
};

export default CoreStateNotice;
