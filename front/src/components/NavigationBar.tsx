interface NavigationBarProps {
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  onSummaryClick: () => void;
  onCreateClick: () => void;
  isVisible?: boolean;
}

const NavigationBar = ({
  goToPreviousWeek,
  goToNextWeek,
  onSummaryClick,
  onCreateClick,
  isVisible = true,
}: NavigationBarProps) => {
  return (
    <nav
      className={`fixed bottom-[calc(22px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-10 flex items-center px-3 py-2 rounded-full bg-surface-glass backdrop-blur-[14px] shadow-elevation-2 transition-[transform,opacity] duration-300 ease-out gap-2 max-[380px]:gap-1 max-[380px]:px-2.5 max-[380px]:py-1.5${
        isVisible
          ? ''
          : ' -translate-x-1/2 translate-y-[calc(100%+20px)] opacity-0 pointer-events-none'
      }`}
    >
      <button
        className="inline-flex items-center justify-center size-11 rounded-full border-none bg-transparent text-[rgba(96,165,250,0.95)] transition-all duration-[180ms] cursor-pointer hover:bg-surface-elevated active:scale-95 [&_.material-icons]:text-[22px]"
        onClick={onSummaryClick}
        aria-label="Сводка"
      >
        <span className="material-icons">analytics</span>
      </button>
      <button
        className="inline-flex items-center justify-center size-11 rounded-full border-none bg-transparent text-text-primary transition-all duration-[180ms] cursor-pointer hover:bg-surface-elevated active:scale-95 [&_.material-icons]:text-[22px]"
        onClick={goToPreviousWeek}
        aria-label="Предыдущая неделя"
      >
        <span className="material-icons">chevron_left</span>
      </button>
      <button
        className="inline-flex items-center justify-center size-[52px] rounded-full border-none bg-gradient-to-br from-btn-primary-bg to-[var(--theme-primary)] text-[var(--btn-primary-text-color)] shadow-elevation-1 transition-all duration-[180ms] cursor-pointer hover:-translate-y-0.5 hover:shadow-elevation-3 active:translate-y-0 active:scale-95 active:shadow-elevation-1 [&_.material-icons]:text-[28px]"
        onClick={onCreateClick}
        aria-label="Создать дело"
      >
        <span className="material-icons">add_circle</span>
      </button>
      <button
        className="inline-flex items-center justify-center size-11 rounded-full border-none bg-transparent text-text-primary transition-all duration-[180ms] cursor-pointer hover:bg-surface-elevated active:scale-95 [&_.material-icons]:text-[22px]"
        onClick={goToNextWeek}
        aria-label="Следующая неделя"
      >
        <span className="material-icons">chevron_right</span>
      </button>
    </nav>
  );
};

export default NavigationBar;
