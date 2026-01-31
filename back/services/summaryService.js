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
  async getDailyBreakdown(startDate, endDate, user_uuid) {
    const rows = await knex('tasks')
      .select(
        knex.raw('DATE(dueDate) as date'),
        knex.raw("COALESCE(SUM(CASE WHEN type = 'income' THEN \"amountEarned\" ELSE 0 END), 0) as totalIncome"),
        knex.raw("COALESCE(SUM(CASE WHEN type = 'expense' THEN \"amountSpent\" ELSE 0 END), 0) as totalExpenses")
      )
      .whereRaw('DATE(dueDate) >= ?', [startDate])
      .andWhereRaw('DATE(dueDate) <= ?', [endDate])
      .andWhere({ user_uuid })
      .groupByRaw('DATE(dueDate)')
      .orderByRaw('DATE(dueDate)');

    return rows.map(row => ({
      date: row.date,
      totalIncome: parseFloat(row.totalIncome) || 0,
      totalExpenses: parseFloat(row.totalExpenses) || 0,
    }));
  }

  async getCategoryBreakdown(startDate, endDate, user_uuid) {
    const rows = await knex('tasks')
      .select(
        'expense_categories.categoryName',
        knex.raw('COALESCE(SUM(tasks."amountSpent"), 0) as totalSpent')
      )
      .leftJoin('expense_categories', 'tasks.expense_category_uuid', 'expense_categories.uuid')
      .where('tasks.type', 'expense')
      .whereRaw('DATE(tasks.dueDate) >= ?', [startDate])
      .andWhereRaw('DATE(tasks.dueDate) <= ?', [endDate])
      .andWhere('tasks.user_uuid', user_uuid)
      .groupBy('tasks.expense_category_uuid')
      .orderBy('totalSpent', 'desc');

    return rows.map(row => ({
      categoryName: row.categoryName || 'Без категории',
      totalSpent: parseFloat(row.totalSpent) || 0,
    }));
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