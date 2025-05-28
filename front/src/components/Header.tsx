import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { fetchSummary } from '../utils/api'; // Import fetchSummary
import { formatDate } from '../utils/helpers';
import './Header.css';

const Header: React.FC = () => {
  const { currentDate, currentWeekStart, goToPreviousWeek, goToNextWeek, goToToday, summary, refreshData } = useAppContext();
  const [dailySummary, setDailySummary] = useState({ totalEarnings: 0, totalExpenses: 0 });

  useEffect(() => {
    const loadDailySummary = async () => {
      try {
        const fetchedDailySummary = await fetchSummary({ date: formatDate(currentDate) });
        setDailySummary(fetchedDailySummary);
      } catch (err) {
        console.error('Failed to fetch daily summary:', err);
      }
    };
    loadDailySummary();
  }, [currentDate, refreshData]); // Re-fetch when currentDate changes or data is refreshed

  const currentWeekFormatted = `${formatDate(currentWeekStart)} - ${formatDate(new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000))}`;
  const currentDateFormatted = formatDate(currentDate);

  return (
    <header className="app-header">
      <div className="date-display">
        <span>Текущая дата: {currentDateFormatted}</span>
      </div>
      <div className="week-navigation">
        <button onClick={goToPreviousWeek}>&lt; Предыдущая неделя</button>
        <span className="week-display">{currentWeekFormatted}</span>
        <button onClick={goToNextWeek}>Следующая неделя &gt;</button>
      </div>
      <button onClick={goToToday} className="today-button">Сегодня</button>
      <div className="summary-display">
        <span>Заработано за день: {dailySummary.totalEarnings.toFixed(2)} ₽</span>
        <span>Потрачено за день: {dailySummary.totalExpenses.toFixed(2)} ₽</span>
        <span>Заработано за неделю: {summary.totalEarnings.toFixed(2)} ₽</span>
        <span>Потрачено за неделю: {summary.totalExpenses.toFixed(2)} ₽</span>
      </div>
    </header>
  );
};

export default Header;