const knex = require('../db.cjs');

class SummaryService {
  async getSummaryForMonthByWeekStart(weekStartDate) { // weekStartDate в формате YYYY-MM-DD
    const date = new Date(weekStartDate);
    // Важно: getMonth() возвращает месяц от 0 (январь) до 11 (декабрь)
    // Для консистентности с getMonthlySummary, который ожидает месяц 1-12, добавляем 1
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1; // Преобразуем 0-11 в 1-12

    // Используем логику, аналогичную getMonthlySummary
    const startDateOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDateOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)); // 0-й день следующего месяца это последний день текущего

    const startDateString = startDateOfMonth.toISOString().slice(0, 10);
    const endDateString = endDateOfMonth.toISOString().slice(0, 10);

    const result = await knex('tasks')
      .select(
        knex.raw("COALESCE(SUM(CASE WHEN type = 'income' THEN \"amountEarned\" ELSE 0 END), 0) as totalEarned"),
        knex.raw("COALESCE(SUM(CASE WHEN type = 'expense' THEN \"amountSpent\" ELSE 0 END), 0) as totalSpent")
      )
      .whereRaw('DATE(dueDate) >= ?', [startDateString])
      .andWhereRaw('DATE(dueDate) <= ?', [endDateString])
      .first();

    const totalEarned = parseFloat(result.totalEarned) || 0;
    const totalSpent = parseFloat(result.totalSpent) || 0;
    const balance = totalEarned - totalSpent;

    return {
      totalIncome: totalEarned,
      totalExpenses: totalSpent,
      balance,
      calculatedForMonth: `${year}-${String(month).padStart(2, '0')}` // Добавим информацию о месяце
    };
  }

  async getDailySummary(date) { // date в формате YYYY-MM-DD
    const result = await knex('tasks')
      .select(
        knex.raw("COALESCE(SUM(CASE WHEN type = 'income' THEN \"amountEarned\" ELSE 0 END), 0) as totalEarned"),
        knex.raw("COALESCE(SUM(CASE WHEN type = 'expense' THEN \"amountSpent\" ELSE 0 END), 0) as totalSpent")
      )
      .whereRaw('DATE(dueDate) = ?', [date])
      .first();

    const totalEarned = parseFloat(result.totalEarned) || 0;
    const totalSpent = parseFloat(result.totalSpent) || 0;
    const balance = totalEarned - totalSpent;

    return {
      totalEarned,
      totalSpent,
      balance,
    };
  }
  async getMonthlySummary(year, month) {
    // month приходит как 1-12, для JavaScript Date месяцы 0-11
    // Создаем даты в UTC, чтобы избежать проблем с часовыми поясами сервера
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    // Для последнего дня месяца: берем первый день следующего месяца (month) и вычитаем 1 миллисекунду,
    // либо берем нулевой день следующего месяца (month) и устанавливаем время на конец дня.
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));


    // Форматируем даты в строки YYYY-MM-DD, подходящие для сравнения с полем DATE
    const startDateString = startDate.toISOString().slice(0, 10);
    const endDateString = endDate.toISOString().slice(0, 10);


    const result = await knex('tasks')
      .select(
        knex.raw("COALESCE(SUM(CASE WHEN type = 'income' THEN \"amountEarned\" ELSE 0 END), 0) as totalEarned"),
        knex.raw("COALESCE(SUM(CASE WHEN type = 'expense' THEN \"amountSpent\" ELSE 0 END), 0) as totalSpent")
      )
      .whereRaw('DATE(dueDate) >= ?', [startDateString])
      .andWhereRaw('DATE(dueDate) <= ?', [endDateString])
      .first();


    const totalEarned = parseFloat(result.totalEarned) || 0;
    const totalSpent = parseFloat(result.totalSpent) || 0;
    const balance = totalEarned - totalSpent;

    return {
      totalEarned,
      totalSpent,
      balance,
    };
  }
}

module.exports = new SummaryService();