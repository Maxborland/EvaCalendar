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


        // Обработка имени категории для задач типа 'expense'
        if (taskData.type === 'expense' && typeof taskData.category === 'string' && taskData.category.trim() !== '') {
            const categoryName = taskData.category;
            // Удаляем поле category из taskData, чтобы оно не попало в newTask и затем в БД
            delete taskData.category;

            console.log(`[taskService.createTask] Searching for expense category by name: "${categoryName}"`);
            const expenseCategory = await knex('expense_categories').where({ category_name: categoryName }).first();

            if (!expenseCategory) {
                console.error(`[taskService.createTask] Expense category not found by name: "${categoryName}"`);
                throw ApiError.badRequest(`Категория расхода '${categoryName}' не найдена`);
            }
            taskData.expenceTypeId = expenseCategory.uuid;
            console.log(`[taskService.createTask] Found expense category UUID: ${expenseCategory.uuid}. Set taskData.expenceTypeId to: ${taskData.expenceTypeId}`);
        }

        if (taskData.childId && !(await validateExistence('children', taskData.childId))) {
            console.error('[taskService.createTask] Validation failed for childId:', taskData.childId);
            throw ApiError.badRequest('Child not found');
        }
        console.log('[taskService.createTask] Validating expenceTypeId. Received value:', taskData.expenceTypeId);
        const categoryExists = await validateExistence('expense_categories', taskData.expenceTypeId);
        console.log('[taskService.createTask] Result of validateExistence for expenceTypeId:', categoryExists);

        if (taskData.expenceTypeId && !categoryExists) {
            console.error('[taskService.createTask] Validation failed for expenceTypeId:', taskData.expenceTypeId);
            throw ApiError.badRequest('Expense category not found');
        }
        console.log('[taskService.createTask] expenceTypeId after validation check:', taskData.expenceTypeId);

        console.log('[taskService.createTask] Received taskData before modification:', JSON.stringify(taskData));
        // Удаляем hourlyRate из taskData, если оно пришло, так как его нет в таблице tasks
        if (taskData.hasOwnProperty('hourlyRate')) {
            delete taskData.hourlyRate;
        }
        const newTask = { uuid: uuidv4(), ...taskData };
        console.log('[taskService.createTask] Generated newTask object for DB insert:', JSON.stringify(newTask));
        try {
            console.log('[taskService.createTask] Attempting to insert newTask into DB. Current expenceTypeId in newTask:', newTask.expenceTypeId);
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


        // Обработка имени категории для задач типа 'expense' при обновлении
        if (taskData.type === 'expense' && typeof taskData.category === 'string' && taskData.category.trim() !== '') {
            const categoryName = taskData.category;
            // Удаляем поле category из taskData, чтобы оно не попало в запрос к БД как колонка
            delete taskData.category;

            console.log(`[taskService.updateTask] Searching for expense category by name: "${categoryName}"`);
            const expenseCategory = await knex('expense_categories').where({ category_name: categoryName }).first();

            if (!expenseCategory) {
                console.error(`[taskService.updateTask] Expense category not found by name: "${categoryName}"`);
                throw ApiError.badRequest(`Категория расхода '${categoryName}' не найдена`);
            }
            taskData.expenceTypeId = expenseCategory.uuid; // Используем uuid категории
            console.log(`[taskService.updateTask] Found expense category UUID: ${expenseCategory.uuid}. Set taskData.expenceTypeId to: ${taskData.expenceTypeId}`);
        } else if (taskData.hasOwnProperty('category') && taskData.category === null) {
            // Если фронтенд явно прислал null для категории, это может означать "убрать категорию"
            // В этом случае мы должны установить expenceTypeId в null
            delete taskData.category; // Удаляем, чтобы не пытаться записать 'category'
            taskData.expenceTypeId = null;
            console.log(`[taskService.updateTask] Category explicitly set to null. Setting expenceTypeId to null.`);
        }


        if (taskData.childId && !(await validateExistence('children', taskData.childId))) {
            throw ApiError.badRequest('Child not found');
        }
        // Валидация expenceTypeId должна происходить ПОСЛЕ его возможной установки из имени категории
        if (taskData.hasOwnProperty('expenceTypeId') && taskData.expenceTypeId !== null && !(await validateExistence('expense_categories', taskData.expenceTypeId))) {
            console.error('[taskService.updateTask] Validation failed for expenceTypeId:', taskData.expenceTypeId);
            throw ApiError.badRequest('Expense category not found by expenceTypeId');
        }

        // Удаляем hourlyRate из taskData, так как это поле относится к таблице children
        if (taskData.hasOwnProperty('hourlyRate')) {
            delete taskData.hourlyRate;
        }

        // Удаляем поля, которых нет в таблице 'tasks' напрямую
        if (taskData.hasOwnProperty('childName')) {
            delete taskData.childName;
        }
        if (taskData.hasOwnProperty('expenseCategoryName')) {
            delete taskData.expenseCategoryName;
        }

        console.log('[taskService.updateTask] Received UUID for update:', uuid);
        console.log('[taskService.updateTask] Cleaned taskData for update:', JSON.stringify(taskData)); // Изменено сообщение в логе
        const updated = await knex('tasks').where({ uuid }).update(taskData);
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

        console.log(`[taskService.getTasksByCategoryUuid] Found category name: ${category.category_name}. Fetching tasks.`);
        return knex('tasks')
            .where({ expenceTypeId: category.uuid })
            .select(
                'tasks.*',
                'children.childName as childName',
                knex.raw('? as expenseCategoryName', [category.category_name])
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

        return knex('tasks')
            .where('tasks.dueDate', dateString) // Используем dueDate, так как это поле в таблице
            .select(
                'tasks.*',
                'children.childName as child_name', // Алиас для соответствия ожиданиям фронтенда
                'expense_categories.category_name as expenseCategoryName'
            )
            .leftJoin('children', 'tasks.childId', 'children.uuid')
            .leftJoin('expense_categories', 'tasks.expenceTypeId', 'expense_categories.uuid');
    }
};

module.exports = taskService;