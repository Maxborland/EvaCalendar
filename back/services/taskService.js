const knex = require('../db');

class TaskService {
  async findTasksByWeekAndDay(weekId, dayOfWeek) {
    return knex('tasks').where({ weekId, dayOfWeek }).select('*');
  }

  async createTask(task) {
    const processedTask = this.processTaskData(task);
    const insertedRows = await knex('tasks').insert(processedTask).returning('id');
    // Для SQLite с .returning('id'), Knex обычно возвращает массив объектов, например: [{ id: 1 }]
    // Убедимся, что primary key в таблице 'tasks' действительно называется 'id'.
    // Предполагая, что это так:
    if (!insertedRows || insertedRows.length === 0 || !insertedRows[0] || typeof insertedRows[0].id === 'undefined') {
      console.error('Ошибка: .returning("id") не вернул ожидаемый ID или вернул неожиданный формат.', insertedRows);
      // Если ID не получен, возвращаем пустой объект, чтобы тесты упали на проверке свойств,
      // что поможет выявить проблему, если она не в этом.
      return {};
    }
    const id = insertedRows[0].id;
    const result = await knex('tasks').where({ id }).first();
    console.log('Созданная задача (исправлено):', result);
    return result;
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
    const processed = { ...task }; // Начинаем с копии исходной задачи

    // Если используются новые поля для перемещения, переназначаем их
    if (processed.newWeekId !== undefined) {
      processed.weekId = processed.newWeekId;
      delete processed.newWeekId;
    }
    if (processed.newDayOfWeek !== undefined) {
      processed.dayOfWeek = processed.newDayOfWeek;
      delete processed.newDayOfWeek;
    }

    // Если есть тип 'income', обрабатываем его специфичные поля
    if (processed.type === 'income') {
      // Здесь можно добавить специализированную обработку для 'income'
      processed.title = processed.title;
      processed.time = processed.time || null;
      processed.address = processed.address || null;
      processed.childName = processed.childName || null;
      processed.hourlyRate = processed.hourlyRate || null;
      processed.category = null;
      processed.amountEarned = null; // Убедимся, что эти поля обнулены или корректно заданы
      processed.amountSpent = null;
    } else if (processed.type === 'expense') {
      // Если есть тип 'expense', обрабатываем его специфичные поля
      processed.title = processed.what;
      processed.comments = processed.expenseComments || null;
      processed.time = null;
      processed.address = null;
      processed.childName = null;
      processed.hourlyRate = null;
      processed.category = null;
      processed.amountEarned = null;
      processed.amountSpent = processed.amount || null;
    }
    // Для других типов или если тип не указан, просто возвращаем обработанный объект.
    // Важно, чтобы Knex получил только те поля, которые существуют в таблице.
    // Если в `task` есть поля, которых нет в таблице `tasks`, Knex их игнорирует.
    // Но новые столбцы, такие как `newWeekId`, могут вызвать ошибку, если они не будут удалены.
    // Уже удалены выше.
    return processed;
  }
}

module.exports = new TaskService();