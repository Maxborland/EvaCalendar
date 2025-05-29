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

import weekController from './controllers/weekController.js';
app.get('/weeks', weekController.getWeek);
app.post('/weeks', weekController.createWeek);

import taskController from './controllers/taskController.js';
app.get('/tasks/:weekId/:dayOfWeek', taskController.getTasksByWeekAndDay);
app.post('/tasks', taskController.createTask);
// Маршрут для перемещения должен быть определен ДО более общего маршрута /tasks/:id
app.put('/tasks/move', taskController.moveTask); // Возвращаем PUT, как было изначально
app.put('/tasks/:id', taskController.updateTask);
app.delete('/tasks/:id', taskController.deleteTask);
app.post('/tasks/:id/duplicate', taskController.duplicateTask);

import noteController from './controllers/noteController.js';
app.get('/notes/:weekId', noteController.getNoteByWeekId);
app.post('/notes', noteController.createOrUpdateNote);
app.delete('/notes/:weekId', noteController.deleteNote);

// Обработчик ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Произошла внутренняя ошибка сервера.' });
});

// Запуск сервера
const server = app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});

export { app, server };

