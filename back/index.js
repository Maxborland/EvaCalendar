import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
dotenv.config(); // Загружаем переменные окружения из .env файла

const app = express();
const port = process.env.PORT || 3001;

// Настройка CORS для разрешения запросов с фронтенда
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Адрес фронтенда (Vite default)
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json()); // Для парсинга JSON-тел запросов

// Простой тестовый маршрут
app.get('/', (req, res) => {
  res.send('API работает!');
});

import weekController, { validateWeek } from './controllers/weekController.js';
app.get('/weeks', validateWeek.getWeek, weekController.getWeek);
app.post('/weeks', validateWeek.createWeek, weekController.createWeek);

import taskController, { validateTask } from './controllers/taskController.js';
app.get(
  '/tasks/:weekId/:dayOfWeek',
  validateTask.getTasksByWeekAndDay,
  taskController.getTasksByWeekAndDay,
);
app.post('/tasks', validateTask.createTask, taskController.createTask);
// Маршрут для перемещения должен быть определен ДО более общего маршрута /tasks/:id
app.put('/tasks/move', validateTask.moveTask, taskController.moveTask); // Возвращаем PUT, как было изначально
app.put('/tasks/:id', validateTask.updateTask, taskController.updateTask);
app.delete('/tasks/:id', validateTask.deleteTask, taskController.deleteTask);
app.post('/tasks/:id/duplicate', validateTask.duplicateTask, taskController.duplicateTask);

import noteController, { validateNote } from './controllers/noteController.js';
app.get('/notes/:weekId', validateNote.getNoteByWeekId, noteController.getNoteByWeekId);
app.post('/notes', validateNote.createOrUpdateNote, noteController.createOrUpdateNote);
app.delete('/notes/:weekId', validateNote.deleteNote, noteController.deleteNote);

import expenseCategoryController, { validateExpenseCategory } from './controllers/expenseCategoryController.js';
app.get('/expense-categories', validateExpenseCategory.getExpenseCategories, expenseCategoryController.getExpenseCategories);
app.post('/expense-categories', validateExpenseCategory.addExpenseCategory, expenseCategoryController.addExpenseCategory);
app.put('/expense-categories/:id', validateExpenseCategory.updateExpenseCategory, expenseCategoryController.updateExpenseCategory);
app.delete('/expense-categories/:id', validateExpenseCategory.deleteExpenseCategory, expenseCategoryController.deleteExpenseCategory);

app.get('/tasks/category', validateTask.getTasksByCategory, taskController.getTasksByCategory);

import {
  addChild,
  deleteChild,
  getAllChildren,
  getChildById,
  updateChild,
  validateChild,
} from './controllers/childrenController.js';

app.get('/children', getAllChildren);
app.get('/children/:id', getChildById);
app.post('/children', validateChild, addChild);
app.put('/children/:id', validateChild, updateChild);
app.delete('/children/:id', deleteChild);

import summaryController, { validateSummary } from './controllers/summaryController.js';
app.get('/summary/:weekId', validateSummary.getWeeklySummary, summaryController.getWeeklySummary);
app.get('/summary/:weekId/:dayOfWeek', validateSummary.getDailySummary, summaryController.getDailySummary);

import errorHandler from './middleware/errorHandler.js';

// Обработчик ошибок (должен быть последним middleware)
app.use(errorHandler);

// Запуск сервера
const server = app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});

export { app, server };

