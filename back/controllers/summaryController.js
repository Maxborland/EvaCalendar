import asyncHandler from 'express-async-handler';
import { param, validationResult } from 'express-validator';
import summaryService from '../services/summaryService.js';
import ApiError from '../utils/ApiError.js';

class SummaryController {
  getWeeklySummary = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const { weekId } = req.params;
    const summary = await summaryService.getWeeklySummary(weekId);
    res.status(200).json(summary);
  });

  getDailySummary = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const { weekId, dayOfWeek } = req.params;
    const summary = await summaryService.getDailySummary(weekId, dayOfWeek);
    res.status(200).json(summary);
  });
}

export default new SummaryController();

export const validateSummary = {
  getWeeklySummary: [
    param('weekId').isInt({ min: 1 }).withMessage('weekId должен быть положительным числом.'),
  ],
  getDailySummary: [
    param('weekId').isInt({ min: 1 }).withMessage('weekId должен быть положительным числом.'),
    param('dayOfWeek').isInt({ min: 1, max: 7 }).withMessage('dayOfWeek должен быть числом от 1 до 7.'),
  ],
};