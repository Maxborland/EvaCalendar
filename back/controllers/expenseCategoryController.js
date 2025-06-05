const express = require('express');
const expenseCategoryService = require('../services/expenseCategoryService');
const ApiError = require('../utils/ApiError');
const router = express.Router();

// Создание новой категории расхода
router.post('/', async (req, res, next) => {
    try {
        const categoryData = req.body;
        const newCategory = await expenseCategoryService.createExpenseCategory(categoryData, req.user.uuid);
        res.status(201).json(newCategory);
    } catch (error) {
        next(error);
    }
});

// Получение списка всех категорий расходов
router.get('/', async (req, res, next) => { // Добавлен next для единообразия обработки ошибок
    try {
        const categories = await expenseCategoryService.getAllExpenseCategories(req.user.uuid);
        res.status(200).json(categories);
    } catch (error) {
        // console.error('Error in get all expense categories controller:', error); // Логирование лучше делать в сервисе или middleware
        // res.status(500).json({ message: 'Error fetching expense categories', error: error.message });
        next(error); // Передаем ошибку в централизованный обработчик
    }
});

// Получение информации о категории расхода по UUID
router.get('/:uuid', async (req, res, next) => { // Добавлен next
    try {
        const { uuid } = req.params;
        const category = await expenseCategoryService.getExpenseCategoryById(uuid, req.user.uuid);
        if (category) {
            res.status(200).json(category);
        } else {
            // res.status(404).json({ message: 'Expense category not found' });
            return next(ApiError.notFound('Expense category not found or access denied')); // Используем ApiError
        }
    } catch (error) {
        // console.error('Error in get expense category by UUID controller:', error);
        // res.status(500).json({ message: 'Error fetching expense category', error: error.message });
        next(error);
    }
});

// Обновление информации о категории расхода
router.put('/:uuid', async (req, res, next) => {
    try {
        const { uuid } = req.params;
        const categoryData = req.body;
        const updatedCategory = await expenseCategoryService.updateExpenseCategory(uuid, categoryData, req.user.uuid);
        if (updatedCategory) {
            res.status(200).json(updatedCategory);
        } else {
            return next(ApiError.notFound('Expense category not found or access denied'));
        }
    } catch (error) {
        next(error);
    }
});

// Удаление категории расхода
router.delete('/:uuid', async (req, res, next) => {
    try {
        const { uuid } = req.params;
        const deleted = await expenseCategoryService.deleteExpenseCategory(uuid, req.user.uuid);
        if (deleted) {
            res.status(204).send(); // No Content
        } else {
            return next(ApiError.notFound('Expense category not found or access denied'));
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;