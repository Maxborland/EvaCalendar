import React, { useEffect, useState } from 'react';
import type { SummaryData } from '../services/api';
import { getDailySummary, getMonthlySummary } from '../services/api'; // Добавляем getMonthlySummary, если он будет использоваться для обновления
import { formatDateForTodayBlock, formatDateToYYYYMMDD } from '../utils/dateUtils';
import './SummaryBlock.css'; // Импортируем CSS

interface DailySummaryData {
  totalEarned: number;
  totalSpent: number;
}

interface SummaryBlockProps {
  today: Date;
  // monthlySummary будет загружаться внутри компонента
  type: 'balance' | 'notes';
}

const SummaryBlock: React.FC<SummaryBlockProps> = ({
    today,
    type,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [dailySummary, setDailySummary] = useState<DailySummaryData | null>(null);
    const [currentMonthlySummary, setCurrentMonthlySummary] = useState<SummaryData | null>(null); // Переименовано для ясности

    useEffect(() => {
        const fetchSummaries = async () => {
            const dateStringForDailySummary = formatDateToYYYYMMDD(today); // "YYYY-MM-DD"
            const parts = dateStringForDailySummary.split('-');
            const year = parseInt(parts[0], 10);
            const monthForMonthlySummary = parseInt(parts[1], 10); // Это 1-12

            try {
                const dailyData = await getDailySummary(dateStringForDailySummary);
                setDailySummary(dailyData);
            } catch (error) {
                console.error("Failed to fetch daily summary:", error);
                setDailySummary({ totalEarned: 0, totalSpent: 0 }); // Устанавливаем значения по умолчанию в случае ошибки
            }

            try {
                // Загружаем или обновляем месячную сводку
                // Убедимся, что month передается как 1-12
                const monthlyData = await getMonthlySummary(year, monthForMonthlySummary);
                setCurrentMonthlySummary(monthlyData);
            } catch (error) {
                console.error("Failed to fetch monthly summary:", error);
                setCurrentMonthlySummary({ totalIncome: 0, totalExpense: 0, balance: 0 }); // Устанавливаем значения по умолчанию
            }
        };

        fetchSummaries();
    }, [today]); // Перезагружаем данные при изменении today

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const formatCurrency = (amount: number | undefined) => {
        return (amount ?? 0).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const renderBalanceContent = () => (
            <div className="summary-header-info">
                <p className="summary-today-display">Сегодня: {formatDateForTodayBlock(today)}</p>
                <div className="summary-balance-header-view">
                    <span className="font-semibold">Баланс: {formatCurrency(currentMonthlySummary?.balance)}</span>
                </div>
            </div>
    );


    return (
        <section className={`summary-block-container ${isExpanded ? 'expanded' : ''}`}>
            <div className="summary-header-clickable" onClick={toggleExpand}>
                {renderBalanceContent()}
            </div>

            {isExpanded && (
                <div className="summary-collapsible-content">
                    {type === 'balance' && currentMonthlySummary && ( // Добавлена проверка на currentMonthlySummary
                        <div className="summary-cards-wrapper">
                            <div className="summary-card income-card">
                                <h3>Доход</h3>
                                <div className="summary-item-group">
                                    <span className="summary-item-label">Сегодня:</span>
                                    <p className="income-value">{formatCurrency(dailySummary?.totalEarned)}</p>
                                </div>
                                <div className="summary-item-group">
                                    <span className="summary-item-label">Месяц:</span>
                                    <p className="income-value">{formatCurrency(currentMonthlySummary.totalIncome)}</p>
                                </div>
                            </div>
                            <div className="summary-card expense-card">
                                <h3>Расход</h3>
                                <div className="summary-item-group">
                                    <span className="summary-item-label">Сегодня:</span>
                                    <p className="expense-value">{formatCurrency(dailySummary?.totalSpent)}</p>
                                </div>
                                <div className="summary-item-group">
                                    <span className="summary-item-label">Месяц:</span>
                                    <p className="expense-value">{formatCurrency(currentMonthlySummary.totalExpense)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
   );
};

export default SummaryBlock;