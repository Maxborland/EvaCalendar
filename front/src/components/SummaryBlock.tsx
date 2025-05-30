import type { Moment } from 'moment';
import moment from 'moment';
import React from 'react';

interface SummaryBlockProps {
  today: Moment;
  dailySummary: { totalIncome: number; totalExpense: number };
  weeklySummary: { totalIncome: number; totalExpense: number };
  weekInfo: { startDate: string; endDate: string };
}

const SummaryBlock: React.FC<SummaryBlockProps> = ({
  today,
  dailySummary,
  weeklySummary,
  weekInfo,
}) => (
  <div className="summary-block compact-summary">
    <p className="summary-block-title">
      Сегодня: {today.format('D MMMM YYYY')}
    </p>
    <div className="summary-block-row">
      <p>
        Заработано сегодня:{' '}
        <span className="summary-block-value">
          {dailySummary.totalIncome.toFixed(2)}₽
        </span>
      </p>
      <p>
        Потрачено сегодня:{' '}
        <span className="summary-block-value">
          {dailySummary.totalExpense.toFixed(2)}₽
        </span>
      </p>
    </div>
    <div className="summary-block-row">
      <p>
        Заработано за неделю:{' '}
        <span className="summary-block-value">
          {weeklySummary.totalIncome.toFixed(2)}₽
        </span>
      </p>
      <p>
        Потрачено за неделю:{' '}
        <span className="summary-block-value">
          {weeklySummary.totalExpense.toFixed(2)}₽
        </span>
      </p>
    </div>
    <p className="summary-block-week">
      Неделя: {moment(weekInfo.startDate).format('D MMM YY')} -{' '}
      {moment(weekInfo.endDate).format('D MMM YY')}
    </p>
  </div>
);

export default SummaryBlock;