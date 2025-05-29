import asyncHandler from 'express-async-handler';
import expenseCategoryService from '../services/expenseCategoryService.js';

class ExpenseCategoryController {
  getExpenseCategories = asyncHandler(async (req, res, next) => {
    const categories = await expenseCategoryService.getAllCategories();
    res.status(200).json(categories);
  });
}

export default new ExpenseCategoryController();