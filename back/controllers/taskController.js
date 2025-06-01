const express = require('express');
const taskService = require('../services/taskService.js');
const ApiError = require('../utils/ApiError.js');

const router = express.Router();

// Middleware для обработки ошибок
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

// GET /tasks/by-category-uuid/:uuid
router.get('/by-category-uuid/:uuid', asyncHandler(async (req, res) => {
    const { uuid } = req.params;
    if (!uuid) {
        throw ApiError.badRequest('Category UUID is required');
    }
    const tasks = await taskService.getTasksByCategoryUuid(uuid);
    if (tasks === null) { // Пример, если сервис возвращает null при ненайденной категории
        throw ApiError.notFound('Category not found or no tasks for this category');
    }
    res.json(tasks);
}));
// GET /tasks/:uuid - Получение задачи по UUID (или всех задач если нет uuid?)
router.get('/:uuid', asyncHandler(async (req, res, next) => {
    const { uuid } = req.params;
    if (uuid) {
      const task = await taskService.getTaskById(uuid);
      if (!task) {
        throw ApiError.notFound('Task not found');
      }
      res.json(task);
    } else {
      // Если UUID не передан, то это запрос на получение всех задач
      const tasks = await taskService.getAllTasks();
      res.json(tasks);
    }
}));

// PUT /tasks/:uuid - Обновление задачи по UUID
router.put('/:uuid', asyncHandler(async (req, res, next) => {
    const updatedCount = await taskService.updateTask(req.params.uuid, req.body);
    if (updatedCount === 0) { // Если 0 строк обновлено, значит задача не найдена или данные не изменились
        const taskExists = await taskService.getTaskById(req.params.uuid);
        if (!taskExists) {
            throw ApiError.notFound('Task not found for update');
        }
        // Если задача существует, но ничего не обновилось (данные те же), вернем 200 и 0.
        // Или можно вернуть сам объект без изменений. Тесты ожидают число.
        res.json(updatedCount); // Возвращаем количество обновленных строк
    } else {
        res.json(updatedCount); // Возвращаем количество обновленных строк
    }
}));

// DELETE /tasks/:uuid - Удаление задачи по UUID
router.delete('/:uuid', asyncHandler(async (req, res, next) => {
    const deleted = await taskService.deleteTask(req.params.uuid);
    if (!deleted) {
        throw ApiError.notFound('Task not found for deletion');
    }
    res.status(204).send(); // No Content
}));

module.exports = router;