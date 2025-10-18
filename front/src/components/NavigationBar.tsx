import './NavigationBar.css';

interface NavigationBarProps {
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
}

const NavigationBar = ({
  goToPreviousWeek,
  goToNextWeek,
}: NavigationBarProps) => {
  return (
    <nav className="navigation-bar">
      <button
        className="navigation-bar__btn navigation-bar__btn--prev"
        onClick={goToPreviousWeek}
        aria-label="Предыдущая неделя"
      >
        <span className="material-icons">chevron_left</span>
      </button>
      <button
        className="navigation-bar__btn navigation-bar__btn--next"
        onClick={goToNextWeek}
        aria-label="Следующая неделя"
      >
        <span className="material-icons">chevron_right</span>
      </button>
    </nav>
  );
};

export default NavigationBar;