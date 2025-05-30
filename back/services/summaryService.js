import knex from '../db.cjs';

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

  async getDailySummary(weekId, dayOfWeek) {
    const income = await knex('tasks')
      .where({ weekId, dayOfWeek, type: 'income' })
      .sum('amountEarned as totalIncome')
      .first();

    const expenses = await knex('tasks')
      .where({ weekId, dayOfWeek, type: 'expense' })
      .sum('amountSpent as totalExpense')
      .first();

    const totalIncome = income.totalIncome || 0;
    const totalExpense = expenses.totalExpense || 0;
    const balance = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      balance,
    };
  }
  async getMonthlySummary(year, month) {
    // Получаем все weekId, относящиеся к указанному году и месяцу
    const weeksInMonth = await knex('weeks')
      .whereRaw('strftime("%Y-%m", startDate) = ?', [`${year}-${String(month).padStart(2, '0')}`])
      .select('id');

    const weekIds = weeksInMonth.map(week => week.id);

    if (weekIds.length === 0) {
      return { totalIncome: 0, totalExpense: 0 };
    }

    const income = await knex('tasks')
      .whereIn('weekId', weekIds)
      .andWhere({ type: 'income' })
      .sum('amountEarned as totalIncome')
      .first();

    const expenses = await knex('tasks')
      .whereIn('weekId', weekIds)
      .andWhere({ type: 'expense' })
      .sum('amountSpent as totalExpense')
      .first();

    const totalIncome = income.totalIncome || 0;
    const totalExpense = expenses.totalExpense || 0;
    const balance = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      balance,
    };
  }
}

export default new SummaryService();