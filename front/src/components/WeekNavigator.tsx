interface WeekNavigatorProps {
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  currentWeekDisplay: string;
  isNavVisible?: boolean;
}

const WeekNavigator = ({
  goToPreviousWeek,
  goToNextWeek,
  currentWeekDisplay,
}: WeekNavigatorProps) => {
  return (
    <nav className="flex justify-between items-center gap-[var(--spacing-md)] p-[var(--spacing-sm)] max-[360px]:gap-[var(--spacing-sm)] max-[360px]:p-1">
      <button
        className="inline-flex items-center justify-center size-11 rounded-xl border border-border-subtle bg-white/[0.04] text-text-primary cursor-pointer transition-all duration-[180ms] hover:bg-white/[0.08] hover:border-border-strong hover:-translate-y-px active:translate-y-0 [&_.material-icons]:text-2xl max-[360px]:size-10 max-[360px]:[&_.material-icons]:text-[22px]"
        onClick={goToPreviousWeek}
        aria-label="Предыдущая неделя"
      >
        <span className="material-icons">chevron_left</span>
      </button>
      <span className="text-base font-medium text-text-primary text-center flex-1 leading-normal max-[360px]:text-sm">
        {currentWeekDisplay}
      </span>
      <button
        className="inline-flex items-center justify-center size-11 rounded-xl border border-border-subtle bg-white/[0.04] text-text-primary cursor-pointer transition-all duration-[180ms] hover:bg-white/[0.08] hover:border-border-strong hover:-translate-y-px active:translate-y-0 [&_.material-icons]:text-2xl max-[360px]:size-10 max-[360px]:[&_.material-icons]:text-[22px]"
        onClick={goToNextWeek}
        aria-label="Следующая неделя"
      >
        <span className="material-icons">chevron_right</span>
      </button>
    </nav>
  );
};

export default WeekNavigator;
