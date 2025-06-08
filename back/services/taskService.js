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

function _calculateReminderAt(dueDate, time, reminderOffset, reminderAt) {
    if (reminderOffset) {
        const [value, unit] = reminderOffset.split(' ');
        const fullDate = moment.utc(`${dueDate}T${time || '00:00:00'}`);
        if (!fullDate.isValid()) {
            throw ApiError.badRequest('Invalid dueDate or time for reminder calculation.');
        }
        return fullDate.subtract(parseInt(value, 10), unit).toDate();
    }
    if (reminderAt) {
        const reminderDate = moment.utc(reminderAt);
        if (!reminderDate.isValid()) {
            throw ApiError.badRequest('Invalid reminder_at date.');
        }
        return reminderDate.toDate();
    }
    return null;
}

const taskService = {
    async createTask(taskData, userId) {
        const {
            type,
            dueDate,
            time,
            title,
            comments,
            reminder_offset,
            reminder_at,
            assigned_to_id,
            child_uuid,
            hoursWorked,
            amount,
            amountEarned,
            amountSpent,
            expense_category_uuid,
        } = taskData;

        if (!type || !dueDate) {
            throw ApiError.badRequest('type and dueDate are required');
        }

        const dataForDb = {
            uuid: uuidv4(),
            creator_uuid: userId,
            title,
            type,
            dueDate,
            time: time || null,
            comments: comments || null,
            reminder_offset: reminder_offset || null,
            child_uuid: null,
            hoursWorked: null,
            amountEarned: null,
            amountSpent: null,
            expense_category_uuid: null,
        };

        dataForDb.reminder_at = _calculateReminderAt(dueDate, dataForDb.time, reminder_offset, reminder_at);

        // Validation and type-specific logic
        if (type === 'income' || type === 'expense') {
            if (assigned_to_id && assigned_to_id !== userId) {
                throw ApiError.badRequest('Income/expense can only be assigned to the creator.');
            }
            dataForDb.user_uuid = userId;

            if (type === 'income') {
                dataForDb.amountEarned = amount || amountEarned || null;
                dataForDb.child_uuid = child_uuid || null;
                dataForDb.hoursWorked = hoursWorked || null;
                if (dataForDb.child_uuid && !(await validateExistence('children', dataForDb.child_uuid))) {
                    throw ApiError.badRequest('Child not found');
                }
                if (!dataForDb.title) {
                    const child = await knex('children').where({ uuid: dataForDb.child_uuid }).first();
                    dataForDb.title = `Доход от ${child ? child.childName : 'ребенка'}`;
                }
            } else { // expense
                dataForDb.amountSpent = amount || amountSpent || null;
                dataForDb.expense_category_uuid = expense_category_uuid || null;
                if (dataForDb.expense_category_uuid && !(await validateExistence('expense_categories', dataForDb.expense_category_uuid))) {
                    throw ApiError.badRequest('Expense category not found');
                }
                if (!dataForDb.title) {
                    const category = await knex('expense_categories').where({ uuid: dataForDb.expense_category_uuid }).first();
                    dataForDb.title = `Расход: ${category ? category.categoryName : 'категория'}`;
                }
            }
        } else if (type === 'task') {
            if (amountEarned || amountSpent || amount) {
                throw ApiError.badRequest('Tasks cannot have amountEarned or amountSpent.');
            }
            let final_assigned_to_id = userId;
            if (assigned_to_id) {
                const assigneeExists = await validateExistence('users', assigned_to_id);
                if (!assigneeExists) {
                    throw ApiError.badRequest(`Assignee with id ${assigned_to_id} not found`);
                }
                final_assigned_to_id = assigned_to_id;
            }
            dataForDb.user_uuid = final_assigned_to_id;
            if (!dataForDb.title) {
                throw ApiError.badRequest('Title is required for task type.');
            }
        } else {
            throw ApiError.badRequest(`Invalid task type: ${type}`);
        }

        try {
            await knex('tasks').insert(dataForDb);
            return dataForDb;
        } catch (error) {
            logError('[taskService.createTask] Error during knex insert:', error);
            throw ApiError.internal('Failed to create task in database', error);
        }
    },

    async getAllTasks(userId) {
        return knex('tasks')
            .select(
                'tasks.*',
                'tasks.reminder_offset',
                'creator.username as creator_username',
                'assignee.username as assignee_username',
                'children.childName as childName',
                'children.parentName as parentName',
                'children.parentPhone as parentPhone',
                'children.address as childAddress',
                'children.hourlyRate as childHourlyRate',
                'expense_categories.categoryName as expenseCategoryName'
            )
            .leftJoin('users as creator', 'tasks.creator_uuid', 'creator.uuid')
            .leftJoin('users as assignee', 'tasks.user_uuid', 'assignee.uuid')
            .leftJoin('children', 'tasks.child_uuid', 'children.uuid')
            .leftJoin('expense_categories', 'tasks.expense_category_uuid', 'expense_categories.uuid')
            .where('tasks.creator_uuid', userId)
            .orWhere('tasks.user_uuid', userId);
    },

    async getTaskById(uuid, userId) {
        const task = await knex('tasks')
            .where('tasks.uuid', uuid)
            .select(
                'tasks.*',
                'tasks.reminder_offset',
                'creator.username as creator_username',
                'assignee.username as assignee_username',
                'children.childName as childName',
                'children.parentName as parentName',
                'children.parentPhone as parentPhone',
                'children.address as childAddress',
                'children.hourlyRate as childHourlyRate',
                'expense_categories.categoryName as expenseCategoryName'
            )
            .leftJoin('users as creator', 'tasks.creator_uuid', 'creator.uuid')
            .leftJoin('users as assignee', 'tasks.user_uuid', 'assignee.uuid')
            .leftJoin('children', 'tasks.child_uuid', 'children.uuid')
            .leftJoin('expense_categories', 'tasks.expense_category_uuid', 'expense_categories.uuid')
            .first();

        if (task && task.creator_uuid !== userId && task.user_uuid !== userId) {
            throw ApiError.forbidden('Access denied');
        }

        return task;
    },

    async updateTask(uuid, taskData, userId) {
        const existingTask = await knex('tasks').where({ uuid }).first();
        if (!existingTask) {
            throw ApiError.notFound('Task not found');
        }

        if (existingTask.creator_uuid !== userId && existingTask.user_uuid !== userId) {
            throw ApiError.forbidden('Access denied');
        }

        const allowedFields = [
            'title', 'type', 'dueDate', 'time', 'comments', 'reminder_offset', 'reminder_at',
            'assigned_to_id',
            'child_uuid', 'hoursWorked', 'amount', 'amountEarned', 'amountSpent',
            'expense_category_uuid', 'completed', 'completed_at'
        ];

        const dataToUpdate = {};
        Object.keys(taskData).forEach(key => {
            if (allowedFields.includes(key)) {
                dataToUpdate[key] = taskData[key];
            }
        });


        // Handle reminder recalculation
        const needsRecalculation = dataToUpdate.hasOwnProperty('dueDate') || dataToUpdate.hasOwnProperty('time') || dataToUpdate.hasOwnProperty('reminder_offset') || dataToUpdate.hasOwnProperty('reminder_at');
        if (needsRecalculation) {
            const newDueDate = dataToUpdate.dueDate || existingTask.dueDate;
            const newTime = dataToUpdate.hasOwnProperty('time') ? dataToUpdate.time : existingTask.time;
            const newReminderOffset = dataToUpdate.hasOwnProperty('reminder_offset') ? dataToUpdate.reminder_offset : existingTask.reminder_offset;
            const newReminderAt = dataToUpdate.hasOwnProperty('reminder_at') ? dataToUpdate.reminder_at : existingTask.reminder_at;

            dataToUpdate.reminder_at = _calculateReminderAt(newDueDate, newTime, newReminderOffset, newReminderAt);
            dataToUpdate.reminder_sent = false;
        }

        const newType = dataToUpdate.type || existingTask.type;
        if (dataToUpdate.type && dataToUpdate.type !== existingTask.type) {
            // При смене типа обнуляем специфичные поля
            dataToUpdate.amountEarned = null;
            dataToUpdate.amountSpent = null;
            dataToUpdate.child_uuid = null;
            dataToUpdate.hoursWorked = null;
            dataToUpdate.expense_category_uuid = null;
        }


        // Validation and type-specific logic
        if (newType === 'income' || newType === 'expense') {
            if (dataToUpdate.assigned_to_id && dataToUpdate.assigned_to_id !== existingTask.creator_uuid) {
                 throw ApiError.badRequest('Income/expense can only be assigned to the creator.');
            }
            dataToUpdate.user_uuid = existingTask.creator_uuid;

            if (newType === 'income') {
                if (dataToUpdate.hasOwnProperty('amount') || dataToUpdate.hasOwnProperty('amountEarned')) {
                    dataToUpdate.amountEarned = dataToUpdate.amount || dataToUpdate.amountEarned;
                }
            } else { // expense
                 if (dataToUpdate.hasOwnProperty('amount') || dataToUpdate.hasOwnProperty('amountSpent')) {
                    dataToUpdate.amountSpent = dataToUpdate.amount || dataToUpdate.amountSpent;
                }
            }

        } else if (newType === 'task') {
            if ((dataToUpdate.hasOwnProperty('amountEarned') && dataToUpdate.amountEarned > 0) || (dataToUpdate.hasOwnProperty('amountSpent') && dataToUpdate.amountSpent > 0)) {
                throw ApiError.badRequest('Tasks cannot have amountEarned or amountSpent.');
            }
             dataToUpdate.amountEarned = null;
             dataToUpdate.amountSpent = null;

            if (dataToUpdate.assigned_to_id) {
                if (existingTask.creator_uuid !== userId) {
                    throw ApiError.forbidden('Only the creator can reassign the task');
                }
                const assigneeExists = await validateExistence('users', dataToUpdate.assigned_to_id);
                if (!assigneeExists) {
                    throw ApiError.badRequest(`Assignee with id ${dataToUpdate.assigned_to_id} not found`);
                }
                dataToUpdate.user_uuid = dataToUpdate.assigned_to_id;
            }
        }

        // clean up
        delete dataToUpdate.assigned_to_id;
        delete dataToUpdate.amount;
        delete dataToUpdate.taskType; // старое поле


        if (Object.keys(dataToUpdate).length === 0) {
            return existingTask;
        }

        await knex('tasks').where({ uuid }).update(dataToUpdate);
        const updatedTask = await this.getTaskById(uuid, userId);
        return updatedTask;
    },

async getTasksByCategoryUuid(categoryUuid, userId) {
        const category = await knex('expense_categories').where({ uuid: categoryUuid }).first(); // TODO: Добавить user_uuid сюда, если категории привязаны к пользователю

        if (!category) {
            return null;
        }

        return knex('tasks')
            .where({ expense_category_uuid: category.uuid })
            .andWhere(function() {
                this.where('tasks.creator_uuid', userId).orWhere('tasks.user_uuid', userId)
            })
            .select(
                'tasks.*',
                'tasks.reminder_offset',
                'creator.username as creator_username',
                'assignee.username as assignee_username',
                'children.childName as childName',
                knex.raw('? as expenseCategoryName', [category.categoryName])
            )
            .leftJoin('users as creator', 'tasks.creator_uuid', 'creator.uuid')
            .leftJoin('users as assignee', 'tasks.user_uuid', 'assignee.uuid')
            .leftJoin('children', 'tasks.child_uuid', 'children.uuid');
    },
    async deleteTask(uuid, userId) {
        const task = await knex('tasks').where({ uuid }).first();
        if (!task) {
            throw ApiError.notFound('Task not found');
        }
        if (task.creator_uuid !== userId) {
            throw ApiError.forbidden('Only the creator can delete the task');
        }
        const deleted = await knex('tasks').where({ uuid }).del();
        return deleted;
    },

    async getTasksByDate(dateString, userId) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            throw ApiError.badRequest('Invalid date format. Please use YYYY-MM-DD.');
        }
        return knex('tasks')
            .where('tasks.dueDate', dateString)
            .andWhere(function() {
                this.where('tasks.creator_uuid', userId).orWhere('tasks.user_uuid', userId)
            })
            .select(
                'tasks.*',
                'tasks.reminder_offset',
                'creator.username as creator_username',
                'assignee.username as assignee_username',
                'children.childName as childName',
                'children.parentName as parentName',
                'children.parentPhone as parentPhone',
                'children.address as childAddress',
                'children.hourlyRate as childHourlyRate',
                'expense_categories.categoryName as expenseCategoryName'
            )
            .leftJoin('users as creator', 'tasks.creator_uuid', 'creator.uuid')
            .leftJoin('users as assignee', 'tasks.user_uuid', 'assignee.uuid')
            .leftJoin('children', 'tasks.child_uuid', 'children.uuid')
            .leftJoin('expense_categories', 'tasks.expense_category_uuid', 'expense_categories.uuid');
    }
};

module.exports = taskService;