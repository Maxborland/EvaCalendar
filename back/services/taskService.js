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
        const requiredFields = ['title', 'dueDate', 'taskType'];
        for (const field of requiredFields) {
            if (!taskData[field]) {
                throw ApiError.badRequest(`${field} is required`);
            }
        }

        const dataForDb = {
            uuid: uuidv4(),
            title: taskData.title,
            type: taskData.taskType,
            dueDate: taskData.dueDate,
            time: taskData.time || null,
            comments: taskData.comments || null,
            // Обнуляем поля по умолчанию, чтобы избежать сохранения старых данных при смене типа
            childId: null,
            hoursWorked: null,
            amountEarned: null,
            amountSpent: null,
            expenseTypeId: null
        };

        if (taskData.taskType === 'income') {
            dataForDb.childId = taskData.childId || null;
            dataForDb.hoursWorked = taskData.hoursWorked || null;
            dataForDb.amountEarned = taskData.amount || null;

            if (dataForDb.childId && !(await validateExistence('children', dataForDb.childId))) {
                console.error('[taskService.createTask] Validation failed for childId:', dataForDb.childId);
                throw ApiError.badRequest('Child not found');
            }
        } else if (taskData.taskType === 'expense') {
            dataForDb.amountSpent = taskData.amount || null;
            dataForDb.expenseTypeId = taskData.expenseTypeId || null;

            if (dataForDb.expenseTypeId && !(await validateExistence('expense_categories', dataForDb.expenseTypeId))) {
                console.error('[taskService.createTask] Validation failed for expenseTypeId (categoryId):', dataForDb.expenseTypeId);
                throw ApiError.badRequest('Expense category not found by categoryId');
            }
        } else {
            throw ApiError.badRequest(`Invalid taskType: ${taskData.taskType}`);
        }

        const newTask = dataForDb;
        try {
            const result = await knex('tasks').insert(newTask);
            // Knex insert: result - кол-во строк для большинства БД, или массив ID для PostgreSQL с .returning().
            // Ошибка обычно вызывает исключение.
            if (Array.isArray(result) && result.length === 0 && newTask) {
                 console.warn('[taskService.createTask] Knex insert result is an empty array, task might not have been inserted if returning IDs was expected.');
            } else if (typeof result === 'number' && result === 0) {
                 console.warn('[taskService.createTask] Knex insert result is 0, task might not have been inserted.');
            }
            return newTask;
        } catch (error) {
            console.error('[taskService.createTask] Error during knex insert:', error.message, error.stack, error.detail, error.constraint);
            throw ApiError.internal('Failed to create task in database', error);
        }
    },

    async getAllTasks() {
        return knex('tasks')
            .select(
                'tasks.*',
                'children.childName as childName',
                'children.parentName as parentName',
                'children.parentPhone as parentPhone',
                'children.address as childAddress',
                'children.hourlyRate as childHourlyRate',
                'expense_categories.categoryName as expenseCategoryName'
            )
            .leftJoin('children', 'tasks.childId', 'children.uuid')
            .leftJoin('expense_categories', 'tasks.expenseTypeId', 'expense_categories.uuid');
    },

    async getTaskById(uuid) {
        const task = await knex('tasks')
            .where('tasks.uuid', uuid)
            .select(
                'tasks.*',
                'children.childName as childName',
                'children.parentName as parentName',
                'children.parentPhone as parentPhone',
                'children.address as childAddress',
                'children.hourlyRate as childHourlyRate',
                'expense_categories.categoryName as expenseCategoryName'
            )
            .leftJoin('children', 'tasks.childId', 'children.uuid')
            .leftJoin('expense_categories', 'tasks.expenseTypeId', 'expense_categories.uuid')
            .first();
        if (task) {
        } else {
        }
        return task;
    },

    async updateTask(uuid, taskData) {
        const dataToUpdate = {};

        if (taskData.hasOwnProperty('title')) {
            if (!taskData.title) throw ApiError.badRequest('title is required');
            dataToUpdate.title = taskData.title;
        }
        if (taskData.hasOwnProperty('dueDate')) {
            if (!taskData.dueDate) throw ApiError.badRequest('dueDate is required');
            dataToUpdate.dueDate = taskData.dueDate;
        }
        if (taskData.hasOwnProperty('taskType')) {
            if (!taskData.taskType) throw ApiError.badRequest('taskType is required');
            dataToUpdate.type = taskData.taskType;
        }

        if (taskData.hasOwnProperty('time')) dataToUpdate.time = taskData.time;
        if (taskData.hasOwnProperty('comments')) dataToUpdate.comments = taskData.comments;

        // Определяем текущий тип задачи, если он не меняется, или новый, если меняется
        const currentTaskType = dataToUpdate.type || (await knex('tasks').where({ uuid }).first()).type;

        if (!currentTaskType) {
             throw ApiError.notFound('Task not found or type is missing');
        }

        // Сбрасываем поля перед установкой новых, если тип задачи меняется или это первое обновление полей типа
        if (taskData.hasOwnProperty('taskType')) {
            dataToUpdate.childId = null;
            dataToUpdate.hoursWorked = null;
            dataToUpdate.amountEarned = null;
            dataToUpdate.amountSpent = null;
            dataToUpdate.expenseTypeId = null;
        }


        if (currentTaskType === 'income') {
            if (taskData.hasOwnProperty('childId')) dataToUpdate.childId = taskData.childId;
            if (taskData.hasOwnProperty('hoursWorked')) dataToUpdate.hoursWorked = taskData.hoursWorked;
            if (taskData.hasOwnProperty('amount')) dataToUpdate.amountEarned = taskData.amount;

            if (dataToUpdate.childId && !(await validateExistence('children', dataToUpdate.childId))) {
                console.error('[taskService.updateTask] Validation failed for childId:', dataToUpdate.childId);
                throw ApiError.badRequest('Child not found');
            }
            // Если тип 'income', убедимся, что поля расходов обнулены, если они не были явно переданы для обнуления
             if (!taskData.hasOwnProperty('amount')) dataToUpdate.amountSpent = null;
             if (!taskData.hasOwnProperty('categoryId')) dataToUpdate.expenseTypeId = null;


        } else if (currentTaskType === 'expense') {
            if (taskData.hasOwnProperty('amount')) dataToUpdate.amountSpent = taskData.amount;
            if (taskData.hasOwnProperty('categoryId')) dataToUpdate.expenseTypeId = taskData.categoryId;

            if (dataToUpdate.expenseTypeId && !(await validateExistence('expense_categories', dataToUpdate.expenseTypeId))) {
                console.error('[taskService.updateTask] Validation failed for expenseTypeId (categoryId):', dataToUpdate.expenseTypeId);
                throw ApiError.badRequest('Expense category not found by categoryId');
            }
             // Если тип 'expense', убедимся, что поля доходов обнулены
             if (!taskData.hasOwnProperty('childId')) dataToUpdate.childId = null;
             if (!taskData.hasOwnProperty('hoursWorked')) dataToUpdate.hoursWorked = null;
             if (!taskData.hasOwnProperty('amount')) dataToUpdate.amountEarned = null;

        } else if (taskData.hasOwnProperty('taskType')) {
            throw ApiError.badRequest(`Invalid taskType: ${taskData.taskType}`);
        }

        // Удаляем поля, которые не должны напрямую обновляться в таблице tasks
        // (например, если фронтенд по ошибке прислал 'category' вместо 'categoryId')
        const disallowedFields = ['category', 'child_id', 'child_name', 'expenseCategoryName', 'hourlyRate', 'amount', 'taskType'];
        for (const field of disallowedFields) {
            if (dataToUpdate.hasOwnProperty(field)) {
                delete dataToUpdate[field];
            }
             if (taskData.hasOwnProperty(field) && field !== 'taskType') {
                delete taskData[field];
            }
        }


        if (Object.keys(dataToUpdate).length === 0) {
            const taskExists = await knex('tasks').where({ uuid }).first();
            return taskExists ? 0 : ApiError.notFound('Task not found for update (no valid fields to update)');
        }

        const updated = await knex('tasks').where({ uuid }).update(dataToUpdate);
        return updated;
    },

async getTasksByCategoryUuid(categoryUuid) {
        const category = await knex('expense_categories').where({ uuid: categoryUuid }).first();

        if (!category) {
            return null;
        }

        return knex('tasks')
            .where({ expenseTypeId: category.uuid })
            .select(
                'tasks.*',
                'children.childName as childName',
                knex.raw('? as expenseCategoryName', [category.categoryName])
            )
            .leftJoin('children', 'tasks.childId', 'children.uuid');
    },
    async deleteTask(uuid) {
        const deleted = await knex('tasks').where({ uuid }).del();
        return deleted;
    },

    async getTasksByDate(dateString) {
        // Валидация формата даты (простая проверка, можно улучшить с помощью библиотек типа moment.js или date-fns)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            throw ApiError.badRequest('Invalid date format. Please use YYYY-MM-DD.');
        }
        const tasks = await knex('tasks')
            .where('tasks.dueDate', dateString)
            .select(
                'tasks.*',
                'children.childName as childName',
                'children.parentName as parentName',
                'children.parentPhone as parentPhone',
                'children.address as childAddress',
                'children.hourlyRate as childHourlyRate',
                'expense_categories.categoryName as expenseCategoryName'
            )
            .leftJoin('children', 'tasks.childId', 'children.uuid')
            .leftJoin('expense_categories', 'tasks.expenseTypeId', 'expense_categories.uuid');
        return tasks;
    }
};

module.exports = taskService;