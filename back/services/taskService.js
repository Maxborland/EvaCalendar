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
        const requiredFields = ['title', 'dueDate', 'taskType'];
        for (const field of requiredFields) {
            if (!taskData[field]) {
                throw ApiError.badRequest(`${field} is required`);
            }
        }

        const dataForDb = {
            uuid: uuidv4(),
            title: taskData.title,
            type: taskData.taskType, // Используем taskType от фронтенда
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
            dataForDb.amountEarned = taskData.amount || null; // Изменено с earnedAmount

            if (dataForDb.childId && !(await validateExistence('children', dataForDb.childId))) {
                console.error('[taskService.createTask] Validation failed for childId:', dataForDb.childId);
                throw ApiError.badRequest('Child not found');
            }
        } else if (taskData.taskType === 'expense') {
            dataForDb.amountSpent = taskData.amount || null; // Изменено с spentAmount
            dataForDb.expenseTypeId = taskData.expenseTypeId || null; // Используем expenseTypeId от фронтенда

            if (dataForDb.expenseTypeId && !(await validateExistence('expense_categories', dataForDb.expenseTypeId))) {
                console.error('[taskService.createTask] Validation failed for expenseTypeId (categoryId):', dataForDb.expenseTypeId);
                throw ApiError.badRequest('Expense category not found by categoryId');
            }
        } else {
            throw ApiError.badRequest(`Invalid taskType: ${taskData.taskType}`);
        }

        console.log('[taskService.createTask] Prepared dataForDb for DB insert:', JSON.stringify(dataForDb));

        const newTask = dataForDb; // Используем очищенный и преобразованный объект
        // console.log('[taskService.createTask] Generated newTask object for DB insert:', JSON.stringify(newTask)); // Дублирующий лог, можно убрать
        try {
            console.log('[taskService.createTask] Attempting to insert newTask into DB. Current expenseTypeId in newTask:', newTask.expenseTypeId); // Изменено с expenseTypeId
            const result = await knex('tasks').insert(newTask);
            console.log('[taskService.createTask] Knex insert result:', JSON.stringify(result));
            // Для PostgreSQL, result обычно содержит массив вставленных строк или количество вставленных строк,
            // в зависимости от конфигурации .returning(). Если .returning() не используется,
            // result может быть количеством вставленных строк (например, 1 при успехе).
            // Проверка result.length === 0 может быть не всегда корректной для insert.
            // Более надежно проверить, не выбросило ли исключение, и что result не является ошибкой.
            // Knex обычно выбрасывает исключение при ошибке вставки.
            if (Array.isArray(result) && result.length === 0 && newTask) { // Если ожидался массив вставленных ID и он пуст
                 console.warn('[taskService.createTask] Knex insert result is an empty array, task might not have been inserted if returning IDs was expected.');
            } else if (typeof result === 'number' && result === 0) { // Если ожидалось количество вставленных строк
                 console.warn('[taskService.createTask] Knex insert result is 0, task might not have been inserted.');
            }
            console.log('[taskService.createTask] Task inserted into DB. Returning newTask.');
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
                'children.childName as childName', // Унифицированный алиас
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
                'children.childName as childName', // Унифицированный алиас
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
            console.log(`[taskService.getTaskById] Task found (uuid: ${uuid}). dueDate from DB:`, task.dueDate);
        } else {
            console.log(`[taskService.getTaskById] Task not found (uuid: ${uuid}).`);
        }
        return task;
    },

    async updateTask(uuid, taskData) {
        const dataToUpdate = {};

        // Обязательные поля, если они переданы
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
            dataToUpdate.type = taskData.taskType; // Используем taskType от фронтенда
        }

        // Необязательные общие поля
        if (taskData.hasOwnProperty('time')) dataToUpdate.time = taskData.time;
        if (taskData.hasOwnProperty('comments')) dataToUpdate.comments = taskData.comments;

        // Определяем текущий тип задачи, если он не меняется, или новый, если меняется
        const currentTaskType = dataToUpdate.type || (await knex('tasks').where({ uuid }).first()).type;

        if (!currentTaskType) {
             throw ApiError.notFound('Task not found or type is missing');
        }

        // Сбрасываем поля перед установкой новых, если тип задачи меняется или это первое обновление полей типа
        if (taskData.hasOwnProperty('taskType')) { // Если тип явно меняется
            dataToUpdate.childId = null;
            dataToUpdate.hoursWorked = null;
            dataToUpdate.amountEarned = null;
            dataToUpdate.amountSpent = null;
            dataToUpdate.expenseTypeId = null;
        }


        if (currentTaskType === 'income') {
            if (taskData.hasOwnProperty('childId')) dataToUpdate.childId = taskData.childId;
            if (taskData.hasOwnProperty('hoursWorked')) dataToUpdate.hoursWorked = taskData.hoursWorked;
            if (taskData.hasOwnProperty('amount')) dataToUpdate.amountEarned = taskData.amount; // Изменено с earnedAmount

            // Валидация, если childId предоставлен
            if (dataToUpdate.childId && !(await validateExistence('children', dataToUpdate.childId))) {
                console.error('[taskService.updateTask] Validation failed for childId:', dataToUpdate.childId);
                throw ApiError.badRequest('Child not found');
            }
            // Если тип 'income', убедимся, что поля расходов обнулены, если они не были явно переданы для обнуления
             if (!taskData.hasOwnProperty('amount')) dataToUpdate.amountSpent = null; // Изменено с spentAmount
             if (!taskData.hasOwnProperty('categoryId')) dataToUpdate.expenseTypeId = null;


        } else if (currentTaskType === 'expense') {
            if (taskData.hasOwnProperty('amount')) dataToUpdate.amountSpent = taskData.amount; // Изменено с spentAmount
            if (taskData.hasOwnProperty('categoryId')) dataToUpdate.expenseTypeId = taskData.categoryId; // Используем categoryId от фронтенда

            // Валидация, если categoryId (expenceTypeId) предоставлен
            if (dataToUpdate.expenseTypeId && !(await validateExistence('expense_categories', dataToUpdate.expenseTypeId))) {
                console.error('[taskService.updateTask] Validation failed for expenseTypeId (categoryId):', dataToUpdate.expenseTypeId);
                throw ApiError.badRequest('Expense category not found by categoryId');
            }
             // Если тип 'expense', убедимся, что поля доходов обнулены
             if (!taskData.hasOwnProperty('childId')) dataToUpdate.childId = null;
             if (!taskData.hasOwnProperty('hoursWorked')) dataToUpdate.hoursWorked = null;
             if (!taskData.hasOwnProperty('amount')) dataToUpdate.amountEarned = null; // Изменено с earnedAmount

        } else if (taskData.hasOwnProperty('taskType')) { // Если пришел новый taskType, но он не 'income' и не 'expense'
            throw ApiError.badRequest(`Invalid taskType: ${taskData.taskType}`);
        }

        // Удаляем поля, которые не должны напрямую обновляться в таблице tasks
        // (например, если фронтенд по ошибке прислал 'category' вместо 'categoryId')
        const disallowedFields = ['category', 'child_id', 'child_name', 'expenseCategoryName', 'hourlyRate', 'amount', 'taskType'];
        for (const field of disallowedFields) {
            if (dataToUpdate.hasOwnProperty(field)) { // taskType уже был использован для dataToUpdate.type
                delete dataToUpdate[field];
            }
             if (taskData.hasOwnProperty(field) && field !== 'taskType') { // также удаляем из исходного taskData, чтобы не попали в dataToUpdate через spread
                delete taskData[field]; // Это не повлияет на dataToUpdate если поле уже скопировано, но для чистоты
            }
        }


        console.log('[taskService.updateTask] Received UUID for update:', uuid);
        console.log('[taskService.updateTask] Original taskData for update:', JSON.stringify(taskData)); // taskData здесь уже может быть изменен
        console.log('[taskService.updateTask] Prepared dataToUpdate for DB:', JSON.stringify(dataToUpdate));

        if (Object.keys(dataToUpdate).length === 0) {
            console.log('[taskService.updateTask] No fields to update after processing. Returning 0.');
            // Если после обработки не осталось полей для обновления (например, пришло только поле amount, которое было преобразовано)
            // и другие поля не изменились, то можно вернуть 0 или текущий объект.
            // Однако, если amount был единственным изменением, то update должен произойти.
            // Эта проверка может быть излишней, если мы уверены, что всегда будут другие поля или amount изменился.
            // Если dataToUpdate пусто, knex.update может не сработать как ожидается или вызвать ошибку.
            // Но если пришел только amount, то он должен был быть преобразован, и dataToUpdate не будет пустым.
            // Если пришел только, например, childName, он будет удален, и dataToUpdate может стать пустым.
            // В таком случае, обновление не требуется.
            const taskExists = await knex('tasks').where({ uuid }).first();
            return taskExists ? 0 : ApiError.notFound('Task not found for update (no valid fields to update)');
        }

        const updated = await knex('tasks').where({ uuid }).update(dataToUpdate);
        console.log('[taskService.updateTask] Update result (updated count):', updated);
        return updated;
    },

async getTasksByCategoryUuid(categoryUuid) {
        console.log(`[taskService.getTasksByCategoryUuid] Searching for expense category by UUID: "${categoryUuid}"`);
        const category = await knex('expense_categories').where({ uuid: categoryUuid }).first();

        if (!category) {
            console.log(`[taskService.getTasksByCategoryUuid] Category with UUID "${categoryUuid}" not found.`);
            return null; // Контроллер обработает это как 404
        }

        console.log(`[taskService.getTasksByCategoryUuid] Found category name: ${category.categoryName}. Fetching tasks.`);
        return knex('tasks')
            .where({ expenseTypeId: category.uuid }) // Изменено с expenseTypeId
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
            .where('tasks.dueDate', dateString) // Используем dueDate, так как это поле в таблице
            .select(
                'tasks.*',
                'children.childName as childName', // Алиас для соответствия ожиданиям фронтенда
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