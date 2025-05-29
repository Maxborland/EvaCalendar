const knex = require('../db');

class TaskService {
  async findTasksByWeekAndDay(weekId, dayOfWeek) {
    return knex('tasks').where({ weekId, dayOfWeek }).select('*');
  }

  async createTask(task) {
    const [id] = await knex('tasks').insert(task).returning('id');
    return knex('tasks').where({ id }).first();
  }

  async updateTask(id, task) {
    await knex('tasks').where({ id }).update(task);
    return knex('tasks').where({ id }).first();
  }

  async deleteTask(id) {
    return knex('tasks').where({ id }).del();
  }

  async findTaskById(id) {
    return knex('tasks').where({ id }).first();
  }
}

module.exports = new TaskService();