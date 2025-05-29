const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Загружаем переменные окружения из .env файла
const db = require('./db'); // Подключаем db.js для инициализации базы данных

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

const weekController = require('./controllers/weekController');
app.get('/weeks', weekController.getWeek);
app.post('/weeks', weekController.createWeek);

const taskController = require('./controllers/taskController');
app.get('/tasks/:weekId/:dayOfWeek', taskController.getTasksByWeekAndDay);
app.post('/tasks', taskController.createTask);
app.put('/tasks/:id', taskController.updateTask);
app.delete('/tasks/:id', taskController.deleteTask);
app.post('/tasks/duplicate/:id', taskController.duplicateTask);
app.put('/tasks/move', taskController.moveTask);

const noteController = require('./controllers/noteController');
app.get('/notes/:weekId', noteController.getNoteByWeekId);
app.post('/notes', noteController.createOrUpdateNote);
app.delete('/notes/:weekId', noteController.deleteNote);

// Обработчик ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Произошла внутренняя ошибка сервера.' });
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});