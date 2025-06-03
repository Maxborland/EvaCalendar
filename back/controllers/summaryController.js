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
  const monthlySummary = await summaryService.getSummaryForMonthByWeekStart(weekStartDate);

  const today = new Date();
  const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD
  const dailySummaryData = await summaryService.getDailySummary(todayString);

  const response = {
    monthlySummary: {
      totalIncome: monthlySummary.totalIncome,
      totalExpenses: monthlySummary.totalExpenses,
      balance: monthlySummary.balance,
      calculatedForMonth: monthlySummary.calculatedForMonth
    },
    dailySummary: {
      totalIncome: dailySummaryData.totalEarned, // В getDailySummary это totalEarned
      totalExpenses: dailySummaryData.totalSpent, // В getDailySummary это totalSpent
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
  const summary = await summaryService.getDailySummary(date);
  res.status(200).json(summary);
}));

// GET /summary/month/:year/:month - Получение месячной сводки
router.get('/month/:year/:month', validateMonthlySummary, asyncHandler(async (req, res, next) => {
  // try { // Убираем try...catch, так как asyncHandler это обработает
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const { year, month } = req.params;
    const summary = await summaryService.getMonthlySummary(parseInt(year), parseInt(month));
    res.status(200).json(summary);
  // } catch (e) {
  //   next(e);
  // }
}));

module.exports = router;