import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

interface WeekNavigatorProps {
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  showFirstHalf: () => void;
  showSecondHalf: () => void;
  isNavVisible: boolean; // Добавляем новое свойство
}

const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  goToPreviousWeek,
  goToNextWeek,
  showFirstHalf,
  showSecondHalf,
  isNavVisible, // Деструктурируем новое свойство
}) => {
  const navClasses = `navigation-buttons ${isNavVisible ? '' : 'navigation-buttons--hidden'}`;

  return (
    <div className={navClasses}>
      <div className="half-week-navigation">
        <button onClick={showFirstHalf}>1-я пол.</button>
        <button onClick={showSecondHalf}>2-я пол.</button>
      </div>
      <div className="week-navigation">
        <button onClick={goToPreviousWeek}>
          <FontAwesomeIcon icon={faChevronLeft} /> Неделя
        </button>
        <button onClick={goToNextWeek}>
          Неделя <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </div>
  );
};

export default WeekNavigator;