const express = require('express');
const taskService = require('../services/taskService.js');
const ApiError = require('../utils/ApiError.js');

const router = express.Router();

const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// POST /tasks - Создание новой задачи
router.post('/', asyncHandler(async (req, res) => {
    const task = await taskService.createTask(req.body);
    res.status(201).json(task);
}));

// GET /tasks - Получение всех задач
router.get('/', asyncHandler(async (req, res) => {
    const tasks = await taskService.getAllTasks();
    res.json(tasks);
}));

// GET /tasks/for-day?date=YYYY-MM-DD
router.get('/for-day', asyncHandler(async (req, res) => {
    const { date } = req.query;
    if (!date) {
        throw ApiError.badRequest('Date query parameter is required');
    }
    const tasks = await taskService.getTasksByDate(date);
    res.json(tasks);
}));

// GET /tasks/by-category-uuid/:uuid
router.get('/by-category-uuid/:uuid', asyncHandler(async (req, res) => {
    const { uuid } = req.params;
    if (!uuid) {
        throw ApiError.badRequest('Category UUID is required');
    }
    const tasks = await taskService.getTasksByCategoryUuid(uuid);
    if (tasks === null) {
        throw ApiError.notFound('Category not found or no tasks for this category');
    }
    res.json(tasks);
}));
// GET /tasks/:uuid - Получение задачи по UUID
router.get('/:uuid', asyncHandler(async (req, res, next) => {
    const { uuid } = req.params;

    if (!uuid) {
        return next(ApiError.badRequest('Task UUID is required. For all tasks, use GET /tasks. For tasks by date, use GET /tasks/for-day?date=YYYY-MM-DD'));
    }

    const task = await taskService.getTaskById(uuid);
    if (!task) {
        throw ApiError.notFound('Task not found');
    }
    res.json(task);
}));

// PUT /tasks/:uuid - Обновление задачи по UUID
router.put('/:uuid', asyncHandler(async (req, res, next) => {
    const updatedCount = await taskService.updateTask(req.params.uuid, req.body);
    if (updatedCount === 0) {
        const taskExists = await taskService.getTaskById(req.params.uuid);
        if (!taskExists) {
            throw ApiError.notFound('Task not found for update');
        }
        res.json(updatedCount);
    } else {
        res.json(updatedCount);
    }
}));

// DELETE /tasks/:uuid - Удаление задачи по UUID
router.delete('/:uuid', asyncHandler(async (req, res, next) => {
    const deleted = await taskService.deleteTask(req.params.uuid);
    if (!deleted) {
        throw ApiError.notFound('Task not found for deletion');
    }
    res.status(204).send();
}));

module.exports = router;