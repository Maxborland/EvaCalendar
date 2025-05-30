import { v4 as uuidv4 } from 'uuid';
import knex from '../db.cjs';

class TaskService {
  async findTasksByWeekAndDay(weekId, dayOfWeek) {
    return knex('tasks').where({ weekId, dayOfWeek }).select('*');
  }

  async findTasksByCategory(categoryParam) {
    let categoryToSearch = categoryParam;

    // Проверяем, является ли переданный параметр UUID (для ID категории)
    const isUUID = (str) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

    if (typeof categoryParam === 'string' && isUUID(categoryParam)) {
      // Если это UUID, ищем название категории по ID из таблицы expense_categories
      const expenseCategory = await knex('expense_categories')
                                    .where({ id: categoryParam })
                                    .select('category_name')
                                    .first();
      if (expenseCategory && expenseCategory.category_name) {
        categoryToSearch = expenseCategory.category_name;
      } else {
        // Если категория по ID не найдена, возвращаем пустой массив, так как нет задач для несуществующей категории
        console.warn(`Категория с ID ${categoryParam} не найдена. Возвращаем пустой список задач.`);
        return [];
      }
    }
    // Используем categoryToSearch (строковое название категории или исходное строковое название)
    return knex('tasks').where({ category: categoryToSearch }).select('*');
  }

  async createTask(task) {
    const processedTask = this.processTaskData(task);
    // Если ID уже предоставлен (например, фронтендом), используем его. Иначе генерируем новый.
    const newId = processedTask.id || uuidv4();
    processedTask.id = newId; // Присваиваем сгенерированный UUID задаче

    console.log('Attempting to insert task:', processedTask);
    await knex('tasks').insert(processedTask); // Удаляем .returning('id')

    const result = await knex('tasks').where({ id: newId }).first(); // Ищем по новому ID
    console.log('Созданная задача:', result);
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
      'time', 'address', 'childId', 'hourlyRate', 'hoursWorked'
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

    // Нам не нужно удалять id, так как он теперь генерируется и/или передается с фронтенда.
    // Knex будет использовать переданный id.

    // Удаляем поля, которых нет в базе данных
    if (processed.what !== undefined) { delete processed.what; }
    if (processed.amount !== undefined) { delete processed.amount; }
    if (processed.expenseComments !== undefined) { delete processed.expenseComments; }
    return processed;
  }
}

export default new TaskService();