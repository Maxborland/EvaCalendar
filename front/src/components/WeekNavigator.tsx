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
      <div className="week-navigation">
        <button onClick={goToPreviousWeek}>&lt; Неделя</button>
        <button onClick={goToNextWeek}>Неделя &gt;</button>
      </div>
      <div className="half-week-navigation">
        <button onClick={showFirstHalf}>1-я пол.</button>
        <button onClick={showSecondHalf}>2-я пол.</button>
      </div>
    </div>
  );
};

export default WeekNavigator;