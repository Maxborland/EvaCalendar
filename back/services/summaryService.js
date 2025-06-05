const knex = require('../db.cjs');

class SummaryService {
  async getSummaryForMonthByWeekStart(weekStartDate, user_uuid) {
    const date = new Date(weekStartDate);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;

    const startDateOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDateOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const startDateString = startDateOfMonth.toISOString().slice(0, 10);
    const endDateString = endDateOfMonth.toISOString().slice(0, 10);

    const result = await knex('tasks')
      .select(
        knex.raw("COALESCE(SUM(CASE WHEN type = 'income' THEN \"amountEarned\" ELSE 0 END), 0) as totalEarned"),
        knex.raw("COALESCE(SUM(CASE WHEN type = 'expense' THEN \"amountSpent\" ELSE 0 END), 0) as totalSpent")
      )
      .whereRaw('DATE(dueDate) >= ?', [startDateString])
      .andWhereRaw('DATE(dueDate) <= ?', [endDateString])
      .andWhere({ user_uuid })
      .first();

    const totalEarned = parseFloat(result.totalEarned) || 0;
    const totalSpent = parseFloat(result.totalSpent) || 0;
    const balance = totalEarned - totalSpent;

    return {
      totalIncome: totalEarned,
      totalExpenses: totalSpent,
      balance,
      calculatedForMonth: `${year}-${String(month).padStart(2, '0')}`
    };
  }

  async getDailySummary(date, user_uuid) {
    const result = await knex('tasks')
      .select(
        knex.raw("COALESCE(SUM(CASE WHEN type = 'income' THEN \"amountEarned\" ELSE 0 END), 0) as totalEarned"),
        knex.raw("COALESCE(SUM(CASE WHEN type = 'expense' THEN \"amountSpent\" ELSE 0 END), 0) as totalSpent")
      )
      .whereRaw('DATE(dueDate) = ?', [date])
      .andWhere({ user_uuid })
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
  async getMonthlySummary(year, month, user_uuid) {
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const startDateString = startDate.toISOString().slice(0, 10);
    const endDateString = endDate.toISOString().slice(0, 10);


    const result = await knex('tasks')
      .select(
        knex.raw("COALESCE(SUM(CASE WHEN type = 'income' THEN \"amountEarned\" ELSE 0 END), 0) as totalEarned"),
        knex.raw("COALESCE(SUM(CASE WHEN type = 'expense' THEN \"amountSpent\" ELSE 0 END), 0) as totalSpent")
      )
      .whereRaw('DATE(dueDate) >= ?', [startDateString])
      .andWhereRaw('DATE(dueDate) <= ?', [endDateString])
      .andWhere({ user_uuid })
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