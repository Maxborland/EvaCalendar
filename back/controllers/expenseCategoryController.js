import asyncHandler from 'express-async-handler';
import { body, param, validationResult } from 'express-validator';
import expenseCategoryService from '../services/expenseCategoryService.js';
import ApiError from '../utils/ApiError.js';

class ExpenseCategoryController {
  getExpenseCategories = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const categories = await expenseCategoryService.getAllCategories();
    res.status(200).json(categories);
  });

  addExpenseCategory = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const { category_name } = req.body;
    // Валидация
    const newCategory = await expenseCategoryService.createCategory(category_name);
    res.status(201).json(newCategory);
  });

  updateExpenseCategory = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const id = req.params.id;
    const { category_name } = req.body;
    // Валидация
    const updated = await expenseCategoryService.updateCategory(id, category_name);
    if (updated) {
      res.status(200).json({ message: 'Category updated successfully' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  });

  deleteExpenseCategory = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const id = req.params.id;
    const deleted = await expenseCategoryService.deleteCategory(id);
    if (deleted) {
      res.status(200).json({ message: 'Category deleted successfully' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  });
}

export const validateExpenseCategory = {
  getExpenseCategories: [],
  addExpenseCategory: [
    body('category_name').isString().notEmpty().withMessage('Category name is required'),
  ],
  updateExpenseCategory: [
    param('id').isInt({ min: 1 }).withMessage('ID категории должен быть положительным числом.'),
    body('category_name')
      .isString().withMessage('Category name must be a string')
      .notEmpty().withMessage('Category name is required')
      .customSanitizer((value, { req }) => {
        try {
          return decodeURIComponent(value);
        } catch (e) {
          throw new Error('Некорректное кодирование URL для имени категории');
        }
      }),
  ],
  deleteExpenseCategory: [
    param('id').isInt({ min: 1 }).withMessage('ID категории должен быть положительным числом.'),
  ],
};

export default new ExpenseCategoryController();