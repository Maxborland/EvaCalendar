import React from 'react';

interface WeekNavigatorProps {
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  showFirstHalf: () => void;
  showSecondHalf: () => void;
}

const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  goToPreviousWeek,
  goToNextWeek,
  showFirstHalf,
  showSecondHalf,
}) => {
  return (
    <div className="navigation-buttons">
      <button onClick={goToPreviousWeek}>Предыдущая неделя</button>
      <button onClick={goToNextWeek}>Следующая неделя</button>
      <button onClick={showFirstHalf}>Первая половина</button>
      <button onClick={showSecondHalf}>Вторая половина</button>
    </div>
  );
};

export default WeekNavigator;