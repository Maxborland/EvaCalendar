import type { Moment } from 'moment';
import React from 'react';
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
    const formatCurrency = (amount: number | undefined) => {
        return (amount ?? 0).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' });
    };

    return (
        <div className="summary-block-container">
            <div className="summary-today">
                <p className="summary-item">Сегодня: {today.format('DD MMMM YYYY')}</p>
            </div>

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

            <div className="summary-balance">
                <p className="summary-item">Баланс: {formatCurrency(monthlySummary.balance)}</p>
            </div>
        </div>
   );
};

export default SummaryBlock;