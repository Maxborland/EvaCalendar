const express = require('express');
const expenseCategoryService = require('../services/expenseCategoryService');
const ApiError = require('../utils/ApiError');
const router = express.Router();

router.post('/', async (req, res, next) => {
    try {
        const categoryData = req.body;
        const newCategory = await expenseCategoryService.createExpenseCategory(categoryData, req.user.uuid);
        res.status(201).json(newCategory);
    } catch (error) {
        next(error);
    }
});

router.get('/', async (req, res, next) => {
    try {
        const categories = await expenseCategoryService.getAllExpenseCategories(req.user.uuid);
        res.status(200).json(categories);
    } catch (error) {
        next(error);
    }
});

router.get('/:uuid', async (req, res, next) => {
    try {
        const { uuid } = req.params;
        const category = await expenseCategoryService.getExpenseCategoryById(uuid, req.user.uuid);
        if (category) {
            res.status(200).json(category);
        } else {
            return next(ApiError.notFound('Expense category not found or access denied'));
        }
    } catch (error) {
        next(error);
    }
});

router.put('/:uuid', async (req, res, next) => {
    try {
        const { uuid } = req.params;
        const categoryData = req.body;

        // Валидация: categoryName обязательно для обновления
        if (!categoryData.categoryName || typeof categoryData.categoryName !== 'string' || categoryData.categoryName.trim() === '') {
            return next(ApiError.badRequest('categoryName is required and must be a non-empty string'));
        }

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

router.delete('/:uuid', async (req, res, next) => {
    try {
        const { uuid } = req.params;
        const deleted = await expenseCategoryService.deleteExpenseCategory(uuid, req.user.uuid);
        if (deleted) {
            res.status(204).send();
        } else {
            return next(ApiError.notFound('Expense category not found or access denied'));
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;