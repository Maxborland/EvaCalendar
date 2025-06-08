const express = require('express');
const taskService = require('../services/taskService.js');
const userService = require('../services/userService.js');
const ApiError = require('../utils/ApiError.js');

const router = express.Router();

const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// GET /api/tasks/assignable-users - Получение пользователей, которым можно назначить задачу
router.get('/assignable-users', asyncHandler(async (req, res) => {
    const users = await userService.getAssignableUsers(req.user.uuid);
    res.json(users);
}));


// POST /tasks - Создание новой задачи
router.post('/', asyncHandler(async (req, res) => {
    const task = await taskService.createTask(req.body, req.user.uuid);
    res.status(201).json(task);
}));

// GET /tasks - Получение всех задач
router.get('/', asyncHandler(async (req, res) => {
    const tasks = await taskService.getAllTasks(req.user.uuid);
    res.json(tasks);
}));

// GET /tasks/for-day?date=YYYY-MM-DD
router.get('/for-day', asyncHandler(async (req, res) => {
    const { date } = req.query;
    if (!date) {
        throw ApiError.badRequest('Date query parameter is required');
    }
    const tasks = await taskService.getTasksByDate(date, req.user.uuid);
    res.json(tasks);
}));

// GET /tasks/by-category-uuid/:uuid
router.get('/by-category-uuid/:uuid', asyncHandler(async (req, res) => {
    const { uuid } = req.params;
    if (!uuid) {
        throw ApiError.badRequest('Category UUID is required');
    }
    const tasks = await taskService.getTasksByCategoryUuid(uuid, req.user.uuid);
    if (tasks === null) {
        // Это условие может быть достигнуто, если категория не найдена.
        // Если категория найдена, но задач нет, сервис вернет пустой массив.
        // Для единообразия можно всегда возвращать массив, даже если категория не найдена,
        // но текущая логика сервиса возвращает null.
        throw ApiError.notFound('Category not found or no tasks for this category for the current user');
    }
    res.json(tasks);
}));
// GET /tasks/:uuid - Получение задачи по UUID
router.get('/:uuid', asyncHandler(async (req, res, next) => {
    const { uuid } = req.params;

    if (!uuid) {
        return next(ApiError.badRequest('Task UUID is required. For all tasks, use GET /tasks. For tasks by date, use GET /tasks/for-day?date=YYYY-MM-DD'));
    }

    const task = await taskService.getTaskById(uuid, req.user.uuid);
    if (!task) {
        throw ApiError.notFound('Task not found or access denied');
    }
    res.json(task);
}));

// PUT /tasks/:uuid - Обновление задачи по UUID
router.put('/:uuid', asyncHandler(async (req, res, next) => {
    const updatedTask = await taskService.updateTask(req.params.uuid, req.body, req.user.uuid);
    res.json(updatedTask);
}));

// DELETE /tasks/:uuid - Удаление задачи по UUID
router.delete('/:uuid', asyncHandler(async (req, res, next) => {
    const deleted = await taskService.deleteTask(req.params.uuid, req.user.uuid);
    if (!deleted) {
        // Это означает, что задача не найдена для данного пользователя или вообще не существует.
        throw ApiError.notFound('Task not found for deletion or access denied');
    }
    res.status(204).send();
}));

module.exports = router;