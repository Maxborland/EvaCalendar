import knex from '../db.js';

class TaskService {
  async findTasksByWeekAndDay(weekId, dayOfWeek) {
    return knex('tasks').where({ weekId, dayOfWeek }).select('*');
  }

  async createTask(task) {
    const processedTask = this.processTaskData(task);
    console.log('Attempting to insert task:', processedTask);
    const insertedRows = await knex('tasks').insert(processedTask).returning('id');
    console.log('Insert result:', insertedRows);
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
    console.log('Attempting to update task with data:', processedTask); // Лог для update
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
    const processed = { ...task };

    // Если используются новые поля для перемещения, переназначаем их
    if (processed.newWeekId !== undefined) {
      processed.weekId = processed.newWeekId;
      delete processed.newWeekId;
    }
    if (processed.newDayOfWeek !== undefined) {
      processed.dayOfWeek = processed.newDayOfWeek;
      delete processed.newDayOfWeek;
    }

    // Добавляем hoursWorked к processed, если оно есть в task
    if (task.hoursWorked !== undefined) {
      processed.hoursWorked = task.hoursWorked;
    }

    // Определяем набор полей для income и expense
    const expenseSpecificFields = [ // Поля, специфичные для расходов
      'category', 'amountSpent'
    ];
    const incomeSpecificFields = [ // Поля, специфичные для доходов
      'time', 'address', 'childName', 'hourlyRate', 'hoursWorked'
    ];


    if (processed.type === 'income') {
      // Для типа income, обнуляем поля, специфичные для расходов
      expenseSpecificFields.forEach(field => {
        processed[field] = null;
      });
      // Убеждаемся, что специфичные для дохода поля установлены или обнулены, если они не предоставлены
      incomeSpecificFields.forEach(field => {
        processed[field] = processed[field] || null;
      });

      // Рассчитываем amountEarned на бэкенде
      if (typeof processed.hourlyRate === 'number' && typeof processed.hoursWorked === 'number') {
        processed.amountEarned = processed.hourlyRate * processed.hoursWorked;
      } else {
        processed.amountEarned = null;
      }
      processed.amountSpent = null; // Убедимся, что amountSpent обнуляется для income

    } else if (processed.type === 'expense') {
      // Для типа expense, обнуляем поля, специфичные для доходов
      incomeSpecificFields.forEach(field => {
        processed[field] = null;
      });
      processed.amountEarned = null; // Убедимся, что amountEarned обнуляется для expense
      processed.amountSpent = processed.amountSpent || null; // Обновлено: используем amountSpent напрямую

      // Важно: на фронтенде what теперь отображается как title, amount как amountSpent.
      // На бэкенде нам нужно убедиться, что title (который мы ожидаем для expense)
      // используется из `processed.title` (который пришел с фронтенда).
      // Также, значение `amountSpent` должно быть корректно.
    } else {
      // В случае неизвестного типа или отсутствия типа, не делаем специфичных обнулений
      // Knex сам проигнорирует неизвестные поля.
    }

    // Удаляем поле 'id', если оно присутствует, чтобы Knex не пытался его обновить
    // Knex автоматически управляет ID при создании новой записи
    if (processed.id !== undefined) { delete processed.id; }

    // Удаляем поля, которых нет в базе данных
    if (processed.what !== undefined) { delete processed.what; }
    if (processed.amount !== undefined) { delete processed.amount; }
    if (processed.expenseComments !== undefined) { delete processed.expenseComments; }
    return processed;
  }
}

export default new TaskService();