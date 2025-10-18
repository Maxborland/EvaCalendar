import './WeekNavigator.css';

interface WeekNavigatorProps {
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  currentWeekDisplay: string;
  isNavVisible?: boolean; // Делаем опциональным, так как он больше не управляет видимостью напрямую
}

const WeekNavigator = ({
  goToPreviousWeek,
  goToNextWeek,
  currentWeekDisplay,
}: WeekNavigatorProps) => {
  return (
    <nav className="week-navigator">
      <button
        className="week-navigator__btn"
        onClick={goToPreviousWeek}
        aria-label="Предыдущая неделя"
      >
        <span className="material-icons">chevron_left</span>
      </button>
      <span className="week-navigator__display">{currentWeekDisplay}</span>
      <button
        className="week-navigator__btn"
        onClick={goToNextWeek}
        aria-label="Следующая неделя"
      >
        <span className="material-icons">chevron_right</span>
      </button>
    </nav>
  );
};

export default WeekNavigator;