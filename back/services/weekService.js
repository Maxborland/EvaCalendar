const db = require('../db');

class WeekService {
  async findWeekByDate(date) {
    const week = await db('weeks')
      .where('startDate', '<=', date)
      .andWhere('endDate', '>=', date)
      .first();
    return week;
  }

  async createWeek(weekData) {
    // Логика создания новой недели в БД
    const [id] = await db('weeks').insert(weekData); // Пример
    return { id, ...weekData };
  }
}

module.exports = new WeekService();