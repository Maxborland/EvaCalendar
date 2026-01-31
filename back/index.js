require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const { scheduleTaskReminders, stopAllCronJobs } = require('./scheduler');
const { validateEnv, getEnvConfig } = require('./config/env');

// Валидируем все необходимые переменные окружения при старте
try {
  validateEnv();
} catch (error) {
  console.error('❌ Environment validation failed:');
  console.error(error.message);
  process.exit(1);
}

const envConfig = getEnvConfig();
const app = express();

app.set('trust proxy', 1);
const notificationRoutes = require('./routes/notificationRoutes');

// CORS: Точное сравнение вместо startsWith
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      ...envConfig.cors.defaultOrigins,
      ...envConfig.cors.origins
    ];

    const allowedSet = new Set(allowedOrigins);

    if (!origin || allowedSet.has(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(helmet());
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
const familyController = require('./controllers/familyController.js');
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
app.use('/api/families', protect, familyController);

// Маршруты для API должны быть выше обработчиков статики и catch-all
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/notifications', notificationRoutes);

const loginLimiter = rateLimit({
  windowMs: envConfig.rateLimit.login.windowMs,
  max: envConfig.rateLimit.login.max,
  message: 'Too many login attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    console.log(`[RATE LIMITER] Blocked request from ${req.ip} to ${req.originalUrl}`);
    res.status(options.statusCode).json({ message: options.message });
  }
});

const registerLimiter = rateLimit({
  windowMs: envConfig.rateLimit.register.windowMs,
  max: envConfig.rateLimit.register.max,
  message: 'Слишком много запросов на регистрацию с этого IP, попробуйте позже.',
  standardHeaders: true,
  legacyHeaders: false,
});

if (envConfig.rateLimit.enabled) {
  app.use('/api/auth/login', loginLimiter);
  app.use('/api/auth/register', registerLimiter);
}

app.use('/api/auth', authRoutes); // authRoutes монтируется напрямую
app.use('/api/users', userRoutes);

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  scheduleTaskReminders();
}

const server = app.listen(envConfig.port, () => {
  console.log(`✅ Сервер запущен на http://localhost:${envConfig.port}`);
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
