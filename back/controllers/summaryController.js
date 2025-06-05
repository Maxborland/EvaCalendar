const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { param, query, validationResult } = require('express-validator');
const summaryService = require('../services/summaryService.js');
const ApiError = require('../utils/ApiError.js');

// Валидация для getSummaryForMonthByWeekStart
const validateSummaryByWeekStart = [
  query('weekStartDate').isISO8601().withMessage('weekStartDate должен быть валидной датой в формате YYYY-MM-DD.'),
];

// Валидация для getDailySummary
const validateDailySummary = [
  query('date').isISO8601().withMessage('date должен быть валидной датой в формате YYYY-MM-DD.'),
];

// Валидация для getMonthlySummary
const validateMonthlySummary = [
  param('year').isInt({ min: 2000, max: 2100 }).withMessage('Год должен быть числом в диапазоне от 2000 до 2100.'),
  param('month').isInt({ min: 1, max: 12 }).withMessage('Месяц должен быть числом от 1 до 12.'),
];

// GET /summary/summary-by-week?weekStartDate=YYYY-MM-DD - Получение сводки за месяц на основе начала недели
router.get('/summary-by-week', validateSummaryByWeekStart, asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(ApiError.badRequest('Ошибки валидации', errors.array()));
  }
  const { weekStartDate } = req.query;
  const user_uuid = req.user.uuid;
  const monthlySummary = await summaryService.getSummaryForMonthByWeekStart(weekStartDate, user_uuid);

  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const dailySummaryData = await summaryService.getDailySummary(todayString, user_uuid);

  const response = {
    monthlySummary: {
      totalIncome: monthlySummary.totalIncome,
      totalExpenses: monthlySummary.totalExpenses,
      balance: monthlySummary.balance,
      calculatedForMonth: monthlySummary.calculatedForMonth
    },
    dailySummary: {
      totalIncome: dailySummaryData.totalEarned,
      totalExpenses: dailySummaryData.totalSpent,
      calculatedForDate: todayString
    }
  };
  res.status(200).json(response);
}));

// GET /summary/daily?date=YYYY-MM-DD - Получение дневной сводки
router.get('/daily', validateDailySummary, asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(ApiError.badRequest('Ошибки валидации', errors.array()));
  }
  const { date } = req.query;
  const user_uuid = req.user.uuid;
  const summary = await summaryService.getDailySummary(date, user_uuid);
  res.status(200).json(summary);
}));

// GET /summary/month/:year/:month - Получение месячной сводки
router.get('/month/:year/:month', validateMonthlySummary, asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const { year, month } = req.params;
    const user_uuid = req.user.uuid;
    const summary = await summaryService.getMonthlySummary(parseInt(year), parseInt(month), user_uuid);
    res.status(200).json(summary);
}));

module.exports = router;