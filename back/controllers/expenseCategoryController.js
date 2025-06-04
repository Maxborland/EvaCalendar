const express = require('express');
const expenseCategoryService = require('../services/expenseCategoryService');
const ApiError = require('../utils/ApiError');
const router = express.Router();

// Создание новой категории расхода
router.post('/', async (req, res, next) => {
    try {
        const categoryData = req.body;
        const newCategory = await expenseCategoryService.createExpenseCategory(categoryData);
        res.status(201).json(newCategory);
    } catch (error) {
        next(error);
    }
});

// Получение списка всех категорий расходов
router.get('/', async (req, res) => {
    try {
        const categories = await expenseCategoryService.getAllExpenseCategories();
        res.status(200).json(categories);
    } catch (error) {
        console.error('Error in get all expense categories controller:', error);
        res.status(500).json({ message: 'Error fetching expense categories', error: error.message });
    }
});

// Получение информации о категории расхода по UUID
router.get('/:uuid', async (req, res) => {
    try {
        const { uuid } = req.params;
        const category = await expenseCategoryService.getExpenseCategoryById(uuid);
        if (category) {
            res.status(200).json(category);
        } else {
            res.status(404).json({ message: 'Expense category not found' });
        }
    } catch (error) {
        console.error('Error in get expense category by UUID controller:', error);
        res.status(500).json({ message: 'Error fetching expense category', error: error.message });
    }
});

// Обновление информации о категории расхода
router.put('/:uuid', async (req, res, next) => {
    try {
        const { uuid } = req.params;
        const categoryData = req.body;
        const updatedCategory = await expenseCategoryService.updateExpenseCategory(uuid, categoryData);
        if (updatedCategory) {
            res.status(200).json(updatedCategory);
        } else {
            return next(ApiError.notFound('Expense category not found'));
        }
    } catch (error) {
        next(error);
    }
});

// Удаление категории расхода
router.delete('/:uuid', async (req, res, next) => {
    try {
        const { uuid } = req.params;
        const deleted = await expenseCategoryService.deleteExpenseCategory(uuid);
        if (deleted) {
            res.status(204).send(); // No Content
        } else {
            return next(ApiError.notFound('Expense category not found'));
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;