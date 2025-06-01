const knex = require('../db.cjs');

class SummaryService {
  async getWeeklySummary(weekId) {
    const income = await knex('tasks')
      .where({ weekId, type: 'income' })
      .sum('amountEarned as totalIncome')
      .first();

    const expenses = await knex('tasks')
      .where({ weekId, type: 'expense' })
      .sum('amountSpent as totalExpense')
      .first();

    return {
      totalIncome: income.totalIncome || 0,
      totalExpense: expenses.totalExpense || 0,
    };
  }

  async getDailySummary(date) { // date в формате YYYY-MM-DD
    console.log(`[SummaryService] getDailySummary called with date: ${date}`);
    const result = await knex('tasks')
      .select(
        knex.raw("COALESCE(SUM(CASE WHEN type = 'income' THEN \"amountEarned\" ELSE 0 END), 0) as totalEarned"),
        knex.raw("COALESCE(SUM(CASE WHEN type = 'expense' THEN \"amountSpent\" ELSE 0 END), 0) as totalSpent")
      )
      .whereRaw('DATE(dueDate) = ?', [date])
      .first();
    console.log(`[SummaryService] getDailySummary SQL result for date ${date}:`, result);

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
    console.log(`[SummaryService] getMonthlySummary called with year: ${year}, month: ${month}`);
    // month приходит как 1-12, для JavaScript Date месяцы 0-11
    // Создаем даты в UTC, чтобы избежать проблем с часовыми поясами сервера
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    // Для последнего дня месяца: берем первый день следующего месяца (month) и вычитаем 1 миллисекунду,
    // либо берем нулевой день следующего месяца (month) и устанавливаем время на конец дня.
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));


    // Форматируем даты в строки YYYY-MM-DD, подходящие для сравнения с полем DATE
    const startDateString = startDate.toISOString().slice(0, 10);
    const endDateString = endDate.toISOString().slice(0, 10);
    console.log(`[SummaryService] getMonthlySummary calculated startDateString: ${startDateString}, endDateString: ${endDateString}`);


    const result = await knex('tasks')
      .select(
        knex.raw("COALESCE(SUM(CASE WHEN type = 'income' THEN \"amountEarned\" ELSE 0 END), 0) as totalEarned"),
        knex.raw("COALESCE(SUM(CASE WHEN type = 'expense' THEN \"amountSpent\" ELSE 0 END), 0) as totalSpent")
      )
      .whereRaw('DATE(dueDate) >= ?', [startDateString])
      .andWhereRaw('DATE(dueDate) <= ?', [endDateString])
      .first();
    console.log(`[SummaryService] getMonthlySummary SQL result for year ${year}, month ${month}:`, result);


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