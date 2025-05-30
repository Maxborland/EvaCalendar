import type { Moment } from 'moment';
import React from 'react';
import type { SummaryData } from '../services/api';

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
    return (
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
       Заработано за месяц:{' '}
       <span className="summary-block-value">
         {monthlySummary.totalIncome.toFixed(2)}₽
       </span>
     </p>
     <p>
       Потрачено за месяц:{' '}
       <span className="summary-block-value">
         {monthlySummary.totalExpense.toFixed(2)}₽
       </span>
     </p>
   </div>
  <div className="summary-block-row">
    <p>
      Остаток средств:{' '}
      <span className="summary-block-value">
        {monthlySummary.balance?.toFixed(2) ?? '0.00'}₽
      </span>
    </p>
  </div>
 </div>
   );
};

export default SummaryBlock;