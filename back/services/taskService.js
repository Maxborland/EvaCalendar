const { v4: uuidv4 } = require('uuid');
const knex = require('../db.cjs');
const ApiError = require('../utils/ApiError.js');
const moment = require('moment');
const { log, error: logError } = require('../utils/logger.js');

async function validateExistence(table, id) {
    if (!id) return true;
    const exists = await knex(table).where({ uuid: id }).first();
    return !!exists;
}

const taskService = {
    async createTask(taskData, userId, title) {
        const requiredFields = ['dueDate', 'taskType'];
        for (const field of requiredFields) {
            if (!taskData[field]) {
                throw ApiError.badRequest(`${field} is required`);
            }
        }

        let finalTitle = title;

        const dataForDb = {
            uuid: uuidv4(),
            user_uuid: userId,
            title: '', // Будет установлено позже
            type: taskData.taskType,
            dueDate: taskData.dueDate,
            time: taskData.time || null,
            comments: taskData.comments || null,
            reminder_at: taskData.reminder_at ? moment.utc(taskData.reminder_at).toDate() : null,
            child_uuid: null,
            hoursWorked: null,
            amountEarned: null,
            amountSpent: null,
            expense_category_uuid: null
        };

        if (taskData.taskType === 'income') {
            dataForDb.child_uuid = taskData.childId || null;
            dataForDb.hoursWorked = taskData.hoursWorked || null;
            dataForDb.amountEarned = taskData.amount || null;

            if (dataForDb.child_uuid && !(await validateExistence('children', dataForDb.child_uuid))) {
                throw ApiError.badRequest('Child not found');
            }
            if (!finalTitle) {
                const child = await knex('children').where({ uuid: dataForDb.child_uuid }).first();
                finalTitle = `Доход от ${child ? child.childName : 'неизвестного ребенка'}`;
            }
        } else if (taskData.taskType === 'expense') {
            dataForDb.amountSpent = taskData.amount || null;
            dataForDb.expense_category_uuid = taskData.expenseTypeId || null;

            if (dataForDb.expense_category_uuid && !(await validateExistence('expense_categories', dataForDb.expense_category_uuid))) {
                throw ApiError.badRequest('Expense category not found by categoryId');
            }
            if (!finalTitle) {
                const category = await knex('expense_categories').where({ uuid: dataForDb.expense_category_uuid }).first();
                finalTitle = `Расход по категории "${category ? category.categoryName : 'неизвестно'}"`;
            }
        } else {
            throw ApiError.badRequest(`Invalid taskType: ${taskData.taskType}`);
        }

        if (!finalTitle) {
            throw ApiError.badRequest('Task title could not be generated and was not provided.');
        }

        dataForDb.title = finalTitle;

        const newTask = dataForDb;
        try {
            const result = await knex('tasks').insert(newTask);
            if (Array.isArray(result) && result.length === 0 && newTask) {
            } else if (typeof result === 'number' && result === 0) {
            }
            return newTask;
        } catch (error) {
            console.error('[taskService.createTask] Error during knex insert:', error.message, error.stack, error.detail, error.constraint);
            throw ApiError.internal('Failed to create task in database', error);
        }
    },

    async getAllTasks(userId) {
        return knex('tasks')
            .where('tasks.user_uuid', userId)
            .select(
                'tasks.*',
                'children.childName as childName',
                'children.parentName as parentName',
                'children.parentPhone as parentPhone',
                'children.address as childAddress',
                'children.hourlyRate as childHourlyRate',
                'expense_categories.categoryName as expenseCategoryName'
            )
            .leftJoin('children', 'tasks.child_uuid', 'children.uuid')
            .leftJoin('expense_categories', 'tasks.expense_category_uuid', 'expense_categories.uuid');
    },

    async getTaskById(uuid, userId) {
        const task = await knex('tasks')
            .where('tasks.uuid', uuid)
            .andWhere('tasks.user_uuid', userId)
            .select(
                'tasks.*',
                'children.childName as childName',
                'children.parentName as parentName',
                'children.parentPhone as parentPhone',
                'children.address as childAddress',
                'children.hourlyRate as childHourlyRate',
                'expense_categories.categoryName as expenseCategoryName'
            )
            .leftJoin('children', 'tasks.child_uuid', 'children.uuid')
            .leftJoin('expense_categories', 'tasks.expense_category_uuid', 'expense_categories.uuid')
            .first();
        return task;
    },

    async updateTask(uuid, taskData, userId, title) {
        log(`[updateTask] Received raw taskData for task ${uuid}:`, taskData);
        const dataToUpdate = {};

        const existingTask = await knex('tasks').where({ uuid, user_uuid: userId }).first();
        if (!existingTask) {
            throw ApiError.notFound('Task not found or access denied');
        }


        if (title) {
            dataToUpdate.title = title;
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
        if (taskData.hasOwnProperty('reminder_at')) {
            dataToUpdate.reminder_at = taskData.reminder_at ? moment.utc(taskData.reminder_at).toDate() : null;
            // Если время напоминания обновляется, нужно сбросить флаг отправки,
            // чтобы планировщик мог отправить новое уведомление.
            dataToUpdate.reminder_sent = false;
        }

        const currentTaskType = dataToUpdate.type || existingTask.type;

        if (!currentTaskType) {
             throw ApiError.notFound('Task type is missing');
        }

        if (taskData.hasOwnProperty('taskType')) {
            dataToUpdate.child_uuid = null;
            dataToUpdate.hoursWorked = null;
            dataToUpdate.amountEarned = null;
            dataToUpdate.amountSpent = null;
            dataToUpdate.expense_category_uuid = null;
        }


        if (currentTaskType === 'income') {
            if (taskData.hasOwnProperty('childId')) dataToUpdate.child_uuid = taskData.childId;
            if (taskData.hasOwnProperty('hoursWorked')) dataToUpdate.hoursWorked = taskData.hoursWorked;
            if (taskData.hasOwnProperty('amount')) dataToUpdate.amountEarned = taskData.amount;

            if (dataToUpdate.child_uuid && !(await validateExistence('children', dataToUpdate.child_uuid))) {
                throw ApiError.badRequest('Child not found');
            }
             if (!taskData.hasOwnProperty('amount')) dataToUpdate.amountSpent = null;
             if (!taskData.hasOwnProperty('categoryId')) dataToUpdate.expense_category_uuid = null;


        } else if (currentTaskType === 'expense') {
            if (taskData.hasOwnProperty('amount')) dataToUpdate.amountSpent = taskData.amount;
            if (taskData.hasOwnProperty('categoryId')) dataToUpdate.expense_category_uuid = taskData.categoryId;

            if (dataToUpdate.expense_category_uuid && !(await validateExistence('expense_categories', dataToUpdate.expense_category_uuid))) {
                throw ApiError.badRequest('Expense category not found by categoryId');
            }
             if (!taskData.hasOwnProperty('childId')) dataToUpdate.child_uuid = null;
             if (!taskData.hasOwnProperty('hoursWorked')) dataToUpdate.hoursWorked = null;
             if (!taskData.hasOwnProperty('amount')) dataToUpdate.amountEarned = null;

        } else if (taskData.hasOwnProperty('taskType')) {
            throw ApiError.badRequest(`Invalid taskType: ${taskData.taskType}`);
        }

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
            return 0;
        }

        const updated = await knex('tasks').where({ uuid, user_uuid: userId }).update(dataToUpdate);
        return updated;
    },

async getTasksByCategoryUuid(categoryUuid, userId) {
        // Сначала проверим, существует ли категория и принадлежит ли она пользователю
        // Важно: категории расходов также должны быть привязаны к пользователю.
        // Если это не так, то фильтрация только задач по user_uuid может быть недостаточной,
        // так как пользователь сможет видеть задачи по чужим категориям, если знает их UUID.
        // Для данной задачи предполагаем, что категории тоже фильтруются по user_uuid где-то выше
        // или что это будет исправлено в другой задаче.
        // Здесь мы просто фильтруем задачи по user_uuid.
        const category = await knex('expense_categories').where({ uuid: categoryUuid }).first(); // TODO: Добавить user_uuid сюда, если категории привязаны к пользователю

        if (!category) {
            return null;
        }

        return knex('tasks')
            .where({ expense_category_uuid: category.uuid, user_uuid: userId })
            .select(
                'tasks.*',
                'children.childName as childName',
                knex.raw('? as expenseCategoryName', [category.categoryName])
            )
            .leftJoin('children', 'tasks.child_uuid', 'children.uuid');
    },
    async deleteTask(uuid, userId) {
        const deleted = await knex('tasks').where({ uuid, user_uuid: userId }).del();
        return deleted;
    },

    async getTasksByDate(dateString, userId) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            throw ApiError.badRequest('Invalid date format. Please use YYYY-MM-DD.');
        }
        const tasks = await knex('tasks')
            .where('tasks.dueDate', dateString)
            .andWhere('tasks.user_uuid', userId)
            .select(
                'tasks.*',
                'children.childName as childName',
                'children.parentName as parentName',
                'children.parentPhone as parentPhone',
                'children.address as childAddress',
                'children.hourlyRate as childHourlyRate',
                'expense_categories.categoryName as expenseCategoryName'
            )
            .leftJoin('children', 'tasks.child_uuid', 'children.uuid')
            .leftJoin('expense_categories', 'tasks.expense_category_uuid', 'expense_categories.uuid');
        return tasks;
    }
};

module.exports = taskService;