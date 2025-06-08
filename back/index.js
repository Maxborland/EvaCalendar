require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { scheduleTaskReminders, stopAllCronJobs } = require('./scheduler');

const app = express();
app.set('trust proxy', 1); // Доверяем одному прокси-серверу (Nginx)
const port = process.env.PORT || 3001;
const notificationRoutes = require('./routes/notificationRoutes');

const corsOptions = {
  origin: function (origin, callback) {
    const defaultOrigins = ['http://localhost:5173', 'https://calendar.home.local', 'https://calendar.maxborland.space'];
    let envOrigins = [];
    if (process.env.FRONTEND_URL) {
      envOrigins = process.env.FRONTEND_URL.split(',').map(url => url.trim());
    }
    const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];
    if (!origin || allowedOrigins.some(allowedOrigin => origin.startsWith(allowedOrigin.trim()))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

// Промежуточный обработчик ошибок для express.json()
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    // Отправляем более информативный ответ, чем просто пустой 400/401
    return res.status(400).json({ message: 'Invalid JSON payload: ' + err.message });
  }
  // Если это не ошибка разбора JSON от express.json, передаем дальше
  next(err);
});

const childrenController = require('./controllers/childrenController.js');
const expenseCategoryController = require('./controllers/expenseCategoryController.js');
const noteController = require('./controllers/noteController.js');
const taskController = require('./controllers/taskController.js');
const summaryController = require('./controllers/summaryController.js');
const authRoutes = require('./routes/authRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const subscriptionRoutes = require('./routes/subscriptionRoutes.js');
const errorHandler = require('./middleware/errorHandler.js');
const { protect } = require('./middleware/authMiddleware.js');

app.get('/', (req, res) => {
  res.send('API работает!');
});

app.use('/api/children', protect, childrenController);
app.use('/api/expense-categories', protect, expenseCategoryController);
app.use('/api/notes', protect, noteController);
app.use('/api/tasks', protect, taskController);
app.use('/api/summary', protect, summaryController);

// Маршруты для API должны быть выше обработчиков статики и catch-all
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/notifications', notificationRoutes);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10000 requests per `window` (TEMPORARILY INCREASED FOR DEBUGGING 429)
  message: 'Too many login attempts from this IP, please try again later.', // ASCII message
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    console.log(`[RATE LIMITER] Blocked request from ${req.ip} to ${req.originalUrl}. Path: ${req.path}. Count: ${req.rateLimit.current}, Limit: ${req.rateLimit.limit}`); // Используем req.originalUrl для более точного пути
    // Используем res.json() для отправки структурированного ответа
    res.status(options.statusCode).json({ message: options.message });
  }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10, // TEMPORARILY INCREASED FOR DEBUGGING 429
  message: 'Слишком много запросов на регистрацию с этого IP, попробуйте позже.',
  standardHeaders: true,
  legacyHeaders: false,
});

if (process.env.NODE_ENV !== 'test' && process.env.DISABLE_RATE_LIMITS_FOR_E2E !== 'true') {
  app.use('/api/auth/login', loginLimiter);
  app.use('/api/auth/register', registerLimiter);
} else {}

app.use('/api/auth', authRoutes); // authRoutes монтируется напрямую
app.use('/api/users', userRoutes);

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  scheduleTaskReminders();
}

const server = app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});

const db = require('./db.cjs');
const { log, error: logError } = require('./utils/logger.js');

const gracefulShutdown = async (signal) => {
  log(`Получен сигнал ${signal}. Начинается грациозное завершение работы...`);

  stopAllCronJobs();

  server.close(async () => {
    log('HTTP-сервер закрыт.');

    try {
      await db.destroy();
      log('Соединение с базой данных успешно закрыто.');
      log('Грациозное завершение работы выполнено.');
      process.exit(0);
    } catch (err) {
      logError('Ошибка при закрытии соединения с базой данных:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = { app, server };
