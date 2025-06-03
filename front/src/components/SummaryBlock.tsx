import React, { useState } from 'react';
import type { SummaryData } from '../services/api';
import { formatDateForTodayBlock } from '../utils/dateUtils';
import './SummaryBlock.css'; // Импортируем CSS

interface SummaryBlockProps {
  today: Date;
  monthlySummary: SummaryData;
  type: 'balance' | 'notes';
}

const SummaryBlock: React.FC<SummaryBlockProps> = ({
    today,
    monthlySummary,
    type,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

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
                    <span className="font-semibold">Баланс: {formatCurrency(monthlySummary.balance)}</span>
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
                    {type === 'balance' && (
                        <div className="summary-cards-wrapper">
                            <div className="summary-card income-card">
                                <h3>Общий доход</h3>
                                <div className="summary-item-group">
                                    <p className="income-value">{formatCurrency(monthlySummary.totalIncome)}</p>
                                </div>
                            </div>
                            <div className="summary-card expense-card">
                                <h3>Общий расход</h3>
                                <div className="summary-item-group">
                                    <p className="expense-value">{formatCurrency(monthlySummary.totalExpense)}</p>
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