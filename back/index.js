const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

// Импорт контроллеров
const childrenController = require('./controllers/childrenController.js');
const expenseCategoryController = require('./controllers/expenseCategoryController.js');
const noteController = require('./controllers/noteController.js');
const taskController = require('./controllers/taskController.js');
const summaryController = require('./controllers/summaryController.js'); // Восстановлено
const errorHandler = require('./middleware/errorHandler.js'); // Восстановлено

app.get('/', (req, res) => {
  res.send('API работает!');
});

// Использование контроллеров
app.use('/children', childrenController);
app.use('/expense-categories', expenseCategoryController);
app.use('/notes', noteController);
app.use('/tasks', taskController);
app.use('/summary', summaryController);

// Обработчик ошибок (должен быть последним middleware)
app.use(errorHandler);

const server = app.listen(port, () => { // Присваиваем результат app.listen переменной server
  console.log(`Сервер запущен на http://localhost:${port}`);
});

module.exports = { app, server }; // Экспортируем уже созданный server
