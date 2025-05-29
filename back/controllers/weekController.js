import asyncHandler from 'express-async-handler';
import { body, query, validationResult } from 'express-validator';
import weekService from '../services/weekService.js';
import ApiError from '../utils/ApiError.js'; // Создадим этот файл позже

class WeekController {
  getWeek = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const { date } = req.query;

    const week = await weekService.findWeekByDate(date);
    if (week) {
      res.status(200).json(week);
    } else {
      next(ApiError.notFound('Неделя не найдена.'));
    }
  });

  createWeek = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const { startDate, endDate } = req.body;

    const existingWeek = await weekService.findWeekByDate(startDate);
    if (existingWeek) {
      return res.status(200).json({ id: existingWeek.id, startDate: existingWeek.startDate, endDate: existingWeek.endDate });
    }

    const newWeek = await weekService.createWeek({ startDate, endDate });
    res.status(201).json(newWeek);
  });
}

export default new WeekController();

export const validateWeek = {
  getWeek: [
    query('date').isISO8601().toDate().withMessage('Неверный формат даты. Используйте YYYY-MM-DD.'),
  ],
  createWeek: [
    body('startDate').isISO8601().toDate().withMessage('Неверный формат начальной даты. Используйте YYYY-MM-DD.'),
    body('endDate').isISO8601().toDate().withMessage('Неверный формат конечной даты. Используйте YYYY-MM-DD.'),
  ],
};