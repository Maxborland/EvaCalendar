import React from 'react';

interface WeekNavigatorProps {
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  currentWeekDisplay: string;
  isNavVisible?: boolean; // Делаем опциональным, так как он больше не управляет видимостью напрямую
}

const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  goToPreviousWeek,
  goToNextWeek,
  currentWeekDisplay,
  // isNavVisible, // Больше не используется для скрытия/показа
}) => {
  // Классы из макета docs/new_design_main_page.html (строки 73-81)
  return (
    <nav className="flex justify-between items-center p-4 bg-card rounded-lg">
      <button
        className="p-2 rounded-md hover:bg-gray-600"
        onClick={goToPreviousWeek}
        aria-label="Предыдущая неделя"
      >
        <span className="material-icons">chevron_left</span>
      </button>
      <span className="text-sm font-medium">{currentWeekDisplay}</span>
      <button
        className="p-2 rounded-md hover:bg-gray-600"
        onClick={goToNextWeek}
        aria-label="Следующая неделя"
      >
        <span className="material-icons">chevron_right</span>
      </button>
    </nav>
  );
};

export default WeekNavigator;