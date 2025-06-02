import type { Moment } from 'moment';
import React, { useState } from 'react';
import type { SummaryData } from '../services/api';
import './SummaryBlock.css';

interface SummaryBlockProps {
  today: Moment;
  dailySummary: SummaryData;
  monthlySummary: SummaryData;
}

const SummaryBlock: React.FC<SummaryBlockProps> = ({
    today,
    dailySummary,
    monthlySummary,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const toggleExpansion = () => setIsExpanded(!isExpanded);

    const formatCurrency = (amount: number | undefined) => {
        return (amount ?? 0).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' });
    };

    return (
        <div className={`summary-block-container ${isExpanded ? 'expanded' : ''}`}>
            <div
                className="summary-header-clickable"
                onClick={toggleExpansion}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-controls="summary-details-content"
            >
                <div className="summary-header-info"> {/* Новый обертывающий div */}
                    <div className="summary-today-display">
                        <p className="summary-item">Сегодня: {today.locale('ru').format('DD MMMM YYYY')}</p>
                    </div>
                    <div className="summary-balance-header-view">
                        <p className="summary-item">Баланс: {formatCurrency(monthlySummary.balance)}</p>
                    </div>
                </div>
            </div>

            <div id="summary-details-content" className="summary-collapsible-content">
                <div className="summary-cards-wrapper">
                    <div className="summary-card income-card">
                        <h3>Доходы</h3>
                        <div className="summary-item-group">
                            <p className="summary-item-label">За сегодня:</p>
                            <p className="summary-item income-value">{formatCurrency(dailySummary.totalIncome)}</p>
                        </div>
                        <div className="summary-item-group">
                            <p className="summary-item-label">За месяц:</p>
                            <p className="summary-item income-value">{formatCurrency(monthlySummary.totalIncome)}</p>
                        </div>
                    </div>

                    <div className="summary-card expense-card">
                        <h3>Расходы</h3>
                        <div className="summary-item-group">
                            <p className="summary-item-label">За сегодня:</p>
                            <p className="summary-item expense-value">{formatCurrency(dailySummary.totalExpense)}</p>
                        </div>
                        <div className="summary-item-group">
                            <p className="summary-item-label">За месяц:</p>
                            <p className="summary-item expense-value">{formatCurrency(monthlySummary.totalExpense)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
   );
};

export default SummaryBlock;