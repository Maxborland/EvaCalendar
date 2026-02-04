/**
 * Environment configuration with validation
 * Проверяет наличие и валидность всех необходимых переменных окружения
 */

const requiredEnvVars = [
  'JWT_SECRET',
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'EMAIL_FROM'
];

const validateEnv = () => {
  const missing = [];

  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n\n` +
      `Please check your .env file and ensure all required variables are set.`
    );
  }

  // Дополнительная валидация
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is too short (< 32 characters). Minimum 32 characters required in production.');
    }
    console.warn('⚠️ WARNING: JWT_SECRET is too short (< 32 characters). Recommended length is 256+ bits.');
  }
};

const getEnvConfig = () => {
  validateEnv();

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001,

    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '24h' // Увеличено с 1h до 24h
    },

    vapid: {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
      email: process.env.VAPID_EMAIL || 'mailto:support@example.com' // Используем переменную вместо захардкода
    },

    email: {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASS,
      from: process.env.EMAIL_FROM
    },

    cors: {
      origins: (process.env.FRONTEND_URL || '').split(',').map(url => url.trim()).filter(Boolean),
      defaultOrigins: process.env.NODE_ENV === 'production'
        ? ['https://calendar.home.local']
        : ['http://localhost:5173', 'https://calendar.home.local']
    },

    rateLimit: {
      enabled: process.env.NODE_ENV !== 'test' && process.env.DISABLE_RATE_LIMITS_FOR_E2E !== 'true',
      login: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10
      },
      register: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10
      }
    }
  };
};

module.exports = {
  validateEnv,
  getEnvConfig
};