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
    const yearStr = String(year);
    const monthStr = String(month).padStart(2, '0');

    const result = await knex('tasks')
      .select(
        knex.raw("COALESCE(SUM(CASE WHEN type = 'income' THEN \"amountEarned\" ELSE 0 END), 0) as totalEarned"),
        knex.raw("COALESCE(SUM(CASE WHEN type = 'expense' THEN \"amountSpent\" ELSE 0 END), 0) as totalSpent")
      )
      .whereRaw("strftime('%Y', dueDate) = ?", [yearStr])
      .andWhereRaw("strftime('%m', dueDate) = ?", [monthStr])
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