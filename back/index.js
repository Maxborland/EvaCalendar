const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
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

// Импорт и использование контроллеров
const childrenController = require('./controllers/childrenController.js');
const expenseCategoryController = require('./controllers/expenseCategoryController.js');
const noteController = require('./controllers/noteController.js');
const taskController = require('./controllers/taskController.js'); // Мой новый контроллер задач

app.use('/children', childrenController);
app.use('/expense-categories', expenseCategoryController);
app.use('/notes', noteController);
app.use('/tasks', taskController); // Используем мой новый контроллер задач

const errorHandler = require('./middleware/errorHandler.js');

// Обработчик ошибок (должен быть последним middleware)
app.use(errorHandler);

// Запуск сервера
const server = app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});

module.exports = { app, server };

