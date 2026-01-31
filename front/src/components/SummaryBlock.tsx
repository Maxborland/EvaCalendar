import clsx from 'clsx';
import { useEffect, useState } from 'react';
import type { SummaryData } from '../services/api';
import { getSummaryByWeek } from '../services/api';
import { createDate } from '../utils/dateUtils';

interface SummaryBlockProps {
    weekStartDate: string;
}

const SummaryBlock = ({
    weekStartDate,
}: SummaryBlockProps) => {
    const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpansion = () => {
        setIsExpanded(!isExpanded);
    };

    useEffect(() => {
        const fetchWeekSummary = async () => {
            if (!weekStartDate) return;

            setIsLoading(true);
            setError(null);
            try {
                const data = await getSummaryByWeek(weekStartDate);
                setSummaryData(data);
            } catch {
                setError("Не удалось загрузить сводку за неделю.");
                setSummaryData({
                    monthlySummary: { totalIncome: 0, totalExpenses: 0, balance: 0, calculatedForMonth: '' },
                    dailySummary: { totalIncome: 0, totalExpenses: 0, calculatedForDate: '' }
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchWeekSummary();
    }, [weekStartDate]);

    const formatCurrency = (amount: number | undefined) => {
        return (amount ?? 0).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatMonthYear = (dateString?: string) => {
        if (!dateString) return '';
        const date = createDate(dateString + '-01');
        return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    };

    const formatFullDate = (dateString?: string) => {
        if (!dateString) return '';

        const date = createDate(dateString);
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    if (isLoading) {
        return (
            <div className="rounded-2xl mb-3 bg-surface-raised shadow-glass flex flex-col overflow-hidden">
                <p className="p-4 text-text-secondary text-center text-sm m-0">Загрузка сводки...</p>
            </div>
        );
    }

    if (error || !summaryData) {
        return (
            <div className="rounded-2xl mb-3 bg-surface-raised shadow-glass flex flex-col overflow-hidden">
                <p className="p-4 text-expense-primary text-center text-sm m-0">{error || 'Нет данных для отображения.'}</p>
            </div>
        );
    }

    const { monthlySummary, dailySummary } = summaryData;

    const titleMonthYear = formatMonthYear(monthlySummary.calculatedForMonth);
    const todayDateFormatted = formatFullDate(dailySummary.calculatedForDate);

    return (
        <section className="rounded-2xl mb-3 bg-surface-raised shadow-glass flex flex-col overflow-hidden">
            <div
                className={clsx(
                    'p-4 cursor-pointer transition-colors duration-200 ease-linear bg-surface-elevated',
                    isExpanded ? 'rounded-t-2xl' : 'rounded-2xl',
                    'hover:bg-[rgba(255,255,255,0.08)]'
                )}
                onClick={toggleExpansion}
            >
                {isExpanded ? (
                    <div className="text-text-primary text-lg font-semibold text-center">
                        Сводка за {titleMonthYear}
                    </div>
                ) : (
                    <>
                        <div className="text-sm text-text-secondary">{todayDateFormatted}</div>
                        <div className="text-lg font-semibold text-text-primary">
                            Баланс: {formatCurrency(monthlySummary.balance)}
                        </div>
                    </>
                )}
            </div>

            <div
                className={clsx(
                    'overflow-hidden transition-all duration-500 ease-out',
                    isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                )}
            >
                {isExpanded && (
                    <div className="p-4 flex flex-col gap-3 bg-surface-muted">
                        <div className="p-3 rounded-xl bg-surface-elevated text-text-primary text-base font-semibold text-center shadow-elevation-1">
                             Баланс ({titleMonthYear}): <span className="font-bold">{formatCurrency(monthlySummary.balance)}</span>
                        </div>

                        <div className="p-3 rounded-xl bg-income-bg border border-income-border">
                            <h4 className="text-base font-bold text-income-primary m-0 mb-2">Доход:</h4>
                            <div className="flex justify-between items-center gap-2 text-sm">
                                <p className="m-0 text-text-secondary">Сегодня: <span className="font-semibold text-income-primary">{formatCurrency(dailySummary.totalIncome)}</span></p>
                                <p className="m-0 text-text-secondary">Месяц: <span className="font-semibold text-income-primary">{formatCurrency(monthlySummary.totalIncome)}</span></p>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-expense-bg border border-expense-border">
                            <h4 className="text-base font-bold text-expense-primary m-0 mb-2">Расход:</h4>
                            <div className="flex justify-between items-center gap-2 text-sm">
                                <p className="m-0 text-text-secondary">Сегодня: <span className="font-semibold text-expense-primary">{formatCurrency(dailySummary.totalExpenses)}</span></p>
                                <p className="m-0 text-text-secondary">Месяц: <span className="font-semibold text-expense-primary">{formatCurrency(monthlySummary.totalExpenses)}</span></p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default SummaryBlock;
