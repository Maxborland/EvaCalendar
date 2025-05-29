const knex = require('../db');

class TaskService {
  async findTasksByWeekAndDay(weekId, dayOfWeek) {
    return knex('tasks').where({ weekId, dayOfWeek }).select('*');
  }

  async createTask(task) {
    const processedTask = this.processTaskData(task);
    const [id] = await knex('tasks').insert(processedTask).returning('id');
    return knex('tasks').where({ id }).first();
  }

  async updateTask(id, task) {
    const processedTask = this.processTaskData(task);
    await knex('tasks').where({ id }).update(processedTask);
    return knex('tasks').where({ id }).first();
  }

  async deleteTask(id) {
    return knex('tasks').where({ id }).del();
  }

  async findTaskById(id) {
    return knex('tasks').where({ id }).first();
  }

  processTaskData(task) {
    const baseData = {
      weekId: task.weekId,
      dayOfWeek: task.dayOfWeek,
      type: task.type,
      comments: task.comments || null, // Общие комментарии
    };

    if (task.type === 'income') {
      return {
        ...baseData,
        title: task.title,
        time: task.time || null,
        address: task.address || null,
        childName: task.childName || null,
        hourlyRate: task.hourlyRate || null,
        category: null,
        amountEarned: null,
        amountSpent: null,
      };
    } else if (task.type === 'expense') {
      return {
        ...baseData,
        title: task.what, // "Что" для расхода переносим в title
        comments: task.expenseComments || null, // Комментарии для расхода
        time: null,
        address: null,
        childName: null,
        hourlyRate: null,
        category: null, // Или использовать category, если это будет отдельное поле
        amountEarned: null,
        amountSpent: task.amount || null, // "Сколько" для расхода переносим в amountSpent
      };
    }
    return task; // Fallback, если тип не распознан
  }
}

module.exports = new TaskService();