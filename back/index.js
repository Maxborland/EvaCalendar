const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

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
const authRoutes = require('./routes/authRoutes.js'); // Добавляем роуты аутентификации
const userRoutes = require('./routes/userRoutes.js'); // Добавляем роуты пользователя
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

// Настройка rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 10, // Максимум 10 запросов с одного IP
  message: 'Слишком много запросов на вход с этого IP, попробуйте позже.',
  standardHeaders: true, // Включить стандартные заголовки RateLimit-*
  legacyHeaders: false, // Отключить заголовки X-RateLimit-*
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 20, // Максимум 20 запросов на регистрацию с одного IP
  message: 'Слишком много запросов на регистрацию с этого IP, попробуйте позже.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Применение rate limiters к роутам аутентификации
// Важно: применяем лимитеры до подключения самих роутов,
// но после глобальных middleware, таких как cors() и express.json()
// Однако, если authRoutes определяет под-пути, то лучше применить лимитеры внутри authRoutes.js
// В данном случае, для простоты, применим здесь, предполагая, что /api/auth/login и /api/auth/register
// являются корневыми для authRoutes или обрабатываются им напрямую.
// Если бы пути были /api/auth/somepath/login, то этот подход не сработал бы для /login конкретно.
// Более точечное применение было бы в authRoutes.js.
// Для текущей задачи, где указано применять к /api/auth/login и /api/auth/register,
// и authRoutes монтируется на /api/auth, применение здесь будет работать, если
// authRoutes.js использует router.post('/login', ...) и router.post('/register', ...)

// Создадим "обертку" для authRoutes, чтобы применить разные лимитеры
const authRouterWithLimits = express.Router();

if (process.env.NODE_ENV !== 'test') {
  authRouterWithLimits.use('/login', loginLimiter);
  authRouterWithLimits.use('/register', registerLimiter);
}
authRouterWithLimits.use('/', authRoutes); // Подключаем оригинальные роуты после лимитеров

app.use('/api/auth', authRouterWithLimits); // Подключаем роуты аутентификации с лимитами (или без, в тесте)
app.use('/api/users', userRoutes); // Подключаем роуты пользователя

// Обработчик ошибок (должен быть последним middleware)
app.use(errorHandler);

const server = app.listen(port, () => { // Присваиваем результат app.listen переменной server
  console.log(`Сервер запущен на http://localhost:${port}`);
});

module.exports = { app, server }; // Экспортируем уже созданный server
