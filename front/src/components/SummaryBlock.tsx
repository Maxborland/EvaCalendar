import React, { useEffect, useState } from 'react';
import type { SummaryData } from '../services/api';
import { getSummaryByWeek } from '../services/api';
import { createDate } from '../utils/dateUtils';

interface SummaryBlockProps {
    weekStartDate: string;
}

const SummaryBlock: React.FC<SummaryBlockProps> = ({
    weekStartDate,
}) => {
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
            } catch (err) {
                console.error("Failed to fetch week summary:", err);
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
        const date = createDate(dateString + '-01'); // Assuming YYYY-MM format
        return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    };

    const formatFullDate = (dateString?: string) => {
        if (!dateString) return '';
        // Expects YYYY-MM-DD from dailySummary.calculatedForDate
        const date = createDate(dateString);
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    if (isLoading) {
        return <div className="p-4 rounded-xl mb-2.5 bg-light-background shadow-[0_4px_12px_var(--color-shadow-light)] flex flex-col gap-2.5"><p>Загрузка сводки...</p></div>;
    }

    if (error || !summaryData) {
        return <div className="p-4 rounded-xl mb-2.5 bg-light-background shadow-[0_4px_12px_var(--color-shadow-light)] flex flex-col gap-2.5"><p className="text-danger-text text-center p-2.5">{error || 'Нет данных для отображения.'}</p></div>;
    }

    const { monthlySummary, dailySummary } = summaryData;

    const titleMonthYear = formatMonthYear(monthlySummary.calculatedForMonth);
    const todayDateFormatted = formatFullDate(dailySummary.calculatedForDate);

    return (
        <section className="rounded-xl mb-2.5 bg-light-background shadow-[0_4px_12px_var(--color-shadow-light)] flex flex-col">
            {/* Кликабельный заголовок */}
            <div
                className={`p-4 cursor-pointer transition-colors duration-200 ease-in-out
                    ${isExpanded
                        ? 'bg-sky-100 hover:bg-sky-200 rounded-t-xl' // Только верхние скругления, если развернуто
                        : 'bg-sky-100 hover:bg-sky-200 rounded-xl' // Все скругления, если свернуто
                    }`}
                onClick={toggleExpansion}
            >
                {isExpanded ? (
                    <div className="text-gray-800 text-lg font-semibold text-center">
                        Сводка за {titleMonthYear}<br/>(на {todayDateFormatted})
                    </div>
                ) : (
                    <>
                        <div className="text-sm text-gray-700">Сегодня: {todayDateFormatted}</div>
                        <div className="text-lg font-semibold text-gray-800">
                            Баланс: {formatCurrency(monthlySummary.balance)}
                        </div>
                    </>
                )}
            </div>

            {/* Анимируемый блок с деталями */}
            <div
                className={`
                    transition-all duration-300 ease-in-out overflow-hidden
                    ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
                    ${isExpanded ? 'rounded-b-xl' : ''}
                    bg-light-background
                `}
            >
                {/* Внутренний контейнер для padding и gap, видим только если isExpanded */}
                {isExpanded && (
                    <div className="p-4 flex flex-col gap-3 bg-gray-600">
                        {/* Баланс в развернутом виде */}
                        <div className="p-3 rounded-lg bg-sky-100 text-gray-800 text-base font-semibold text-center shadow-sm">
                             Баланс ({titleMonthYear}): <span className="font-semibold text-gray-800">{formatCurrency(monthlySummary.balance)}</span>
                        </div>

                        {/* Доход */}
                        <div className="p-3 rounded-lg bg-emerald-100 shadow-sm">
                            <h4 className="text-md font-bold text-emerald-800 mb-2">Доход:</h4>
                            <div className="flex justify-between items-center gap-2 w-full text-sm">
                                <p className="text-emerald-700 mb-0">
                                    Сегодня: <span className="font-semibold">{formatCurrency(dailySummary.totalIncome)}</span>
                                </p>
                                <p className="text-emerald-700 mb-0">
                                    Месяц: <span className="font-semibold">{formatCurrency(monthlySummary.totalIncome)}</span>
                                </p>
                            </div>
                        </div>

                        {/* Расход */}
                        <div className="p-3 rounded-lg bg-rose-100 shadow-sm">
                            <h4 className="text-md font-bold text-rose-800 mb-2">Расход:</h4>
                            <div className="flex justify-between items-center gap-2 w-full text-sm">
                                <p className="text-rose-700 mb-0">
                                    Сегодня: <span className="font-semibold">{formatCurrency(dailySummary.totalExpenses)}</span>
                                </p>
                                <p className="text-rose-700 mb-0">
                                    Месяц: <span className="font-semibold">{formatCurrency(monthlySummary.totalExpenses)}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default SummaryBlock;