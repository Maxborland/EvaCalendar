import { faCircleChevronLeft, faCircleChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

interface WeekNavigatorProps {
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  currentWeekDisplay: string; // Новое свойство для отображения диапазона дат
  isNavVisible: boolean;
  // showFirstHalf и showSecondHalf удалены
}

const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  goToPreviousWeek,
  goToNextWeek,
  currentWeekDisplay,
  isNavVisible,
}) => {
  // Обновляем классы для нового макета и стилей
  // Основной контейнер теперь будет центрировать элементы
  const navContainerClasses = `week-navigator-container ${isNavVisible ? '' : 'week-navigator-container--hidden'}`;

  return (
    <div className={navContainerClasses}>
      {/* half-week-navigation удален */}
      <button className="week-nav-button prev-week" onClick={goToPreviousWeek} aria-label="Предыдущая неделя">
        <FontAwesomeIcon icon={faCircleChevronLeft} />
      </button>
      <span className="current-week-display">{currentWeekDisplay}</span>
      <button className="week-nav-button next-week" onClick={goToNextWeek} aria-label="Следующая неделя">
        <FontAwesomeIcon icon={faCircleChevronRight} />
      </button>
    </div>
  );
};

export default WeekNavigator;