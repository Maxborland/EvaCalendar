const { v4: uuidv4 } = require('uuid');
const knex = require('../db.cjs');
const ApiError = require('../utils/ApiError.js');

async function validateExistence(table, id) {
    if (!id) return true;
    const exists = await knex(table).where({ uuid: id }).first();
    return !!exists;
}

const taskService = {
    async createTask(taskData) {
        // Проверка обязательных полей
        const requiredFields = ['title', 'dueDate', 'type']; // 'description' заменено на 'type' или удалено, если не обязательно. 'type' часто обязателен.
                                                        // Если 'comments' обязательно, добавьте его сюда. Судя по тестам, 'type' обязателен.
                                                        // Поле 'description' отсутствует в миграции, поэтому его убираем из обязательных.
        for (const field of requiredFields) {
            if (!taskData[field]) {
                throw ApiError.badRequest(`${field} is required`);
            }
        }

        // Дополнительная проверка на 'comments', если оно стало обязательным вместо 'description'
        // if (!taskData.comments) { // Пример, если comments обязательно
        //     throw ApiError.badRequest(`comments is required`);
        // }


        if (taskData.childId && !(await validateExistence('children', taskData.childId))) {
            throw ApiError.badRequest('Child not found');
        }
        if (taskData.expenceTypeId && !(await validateExistence('expense_categories', taskData.expenceTypeId))) {
            throw ApiError.badRequest('Expense category not found');
        }

        console.log('[taskService.createTask] Received taskData:', JSON.stringify(taskData)); // Добавлено логирование
        // Удаляем hourlyRate из taskData, если оно пришло, так как его нет в таблице tasks
        if (taskData.hasOwnProperty('hourlyRate')) {
            delete taskData.hourlyRate;
        }
        const newTask = { uuid: uuidv4(), ...taskData };
        console.log('[taskService.createTask] Generated newTask object:', JSON.stringify(newTask));
        try {
            const result = await knex('tasks').insert(newTask);
            console.log('[taskService.createTask] Knex insert result:', JSON.stringify(result));
            if (result && result.length === 0) { // Или другая проверка в зависимости от того, что возвращает knex для вашего драйвера при успехе
                console.warn('[taskService.createTask] Knex insert result is empty, task might not have been inserted.');
            }
            console.log('[taskService.createTask] Task inserted into DB. Returning newTask.');
            return newTask;
        } catch (error) {
            console.error('[taskService.createTask] Error during knex insert:', error);
            throw ApiError.internal('Failed to create task in database', error);
        }
    },

    async getAllTasks() {
        return knex('tasks')
            .select(
                'tasks.*',
                'children.childName as childName',
                'expense_categories.category_name as expenseCategoryName'
            )
            .leftJoin('children', 'tasks.childId', 'children.uuid')
            .leftJoin('expense_categories', 'tasks.expenceTypeId', 'expense_categories.uuid');
    },

    async getTaskById(uuid) {
        return knex('tasks')
            .where('tasks.uuid', uuid)
            .select(
                'tasks.*',
                'children.childName as childName',
                'expense_categories.category_name as expenseCategoryName'
            )
            .leftJoin('children', 'tasks.childId', 'children.uuid')
            .leftJoin('expense_categories', 'tasks.expenceTypeId', 'expense_categories.uuid')
            .first();
    },

    async updateTask(uuid, taskData) {
        // Проверка обязательных полей
        // Убираем 'description' из обязательных, так как его нет в таблице.
        // Добавляем 'type', если он обязателен при обновлении.
        // Судя по тестам, при обновлении передаются не все поля, а только изменяемые.
        // Поэтому, возможно, здесь не нужно проверять все обязательные поля,
        // а только те, которые пришли в taskData и являются частью модели.
        // Оставим проверку только для тех полей, которые действительно должны быть в taskData при обновлении.
        // Если какие-то поля обязательны всегда (например, title, dueDate), их нужно проверять.
        const presentRequiredFields = ['title', 'dueDate', 'type']; // Примерный список, нужно уточнить по логике приложения
        for (const field of presentRequiredFields) {
            if (taskData.hasOwnProperty(field) && !taskData[field]) { // Проверяем только если поле пришло и оно пустое
                throw ApiError.badRequest(`${field} is required`);
            }
        }
        // Если обновляется только часть полей, то проверять все requiredFields неверно.
        // Например, если обновляется только title, то dueDate и type не придут, и будет ошибка.
        // Уточним: тесты передают только title, description (заменим на comments), dueDate, amountEarned.
        // Значит, проверять нужно только те из них, которые обязательны и пришли пустыми.
        // Или, если поле обязательно для существования записи, но не пришло на обновление - это ОК.
        // Сервис должен проверять валидность данных, которые ему передали.

        // Пример более корректной проверки для обновления:
        if (taskData.hasOwnProperty('title') && !taskData.title) {
            throw ApiError.badRequest('title is required');
        }
        if (taskData.hasOwnProperty('dueDate') && !taskData.dueDate) {
            throw ApiError.badRequest('dueDate is required');
        }
        if (taskData.hasOwnProperty('type') && !taskData.type) {
            throw ApiError.badRequest('type is required');
        }


        if (taskData.childId && !(await validateExistence('children', taskData.childId))) {
            throw ApiError.badRequest('Child not found');
        }
        if (taskData.expenceTypeId && !(await validateExistence('expense_categories', taskData.expenceTypeId))) {
            throw ApiError.badRequest('Expense category not found');
        }

        // Удаляем hourlyRate из taskData, так как это поле относится к таблице children
        if (taskData.hasOwnProperty('hourlyRate')) {
            delete taskData.hourlyRate;
        }

        console.log('[taskService.updateTask] Received UUID for update:', uuid);
        console.log('[taskService.updateTask] Received taskData for update:', JSON.stringify(taskData));
        const updated = await knex('tasks').where({ uuid }).update(taskData);
        console.log('[taskService.updateTask] Update result (updated count):', updated);
        return updated;
    },

    async deleteTask(uuid) {
        const deleted = await knex('tasks').where({ uuid }).del();
        return deleted;
    }
};

module.exports = taskService;