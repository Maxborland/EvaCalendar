import knex from '../db.js';

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

    return {
      totalIncome: income.totalIncome || 0,
      totalExpense: expenses.totalExpense || 0,
    };
  }
}

export default new SummaryService();