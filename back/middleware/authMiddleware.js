const jwt = require('jsonwebtoken');
const knex = require('../db.cjs'); // Предполагаем, что db.cjs экспортирует настроенный экземпляр Knex

// Секретный ключ для JWT. Должен совпадать с ключом в authController.js.
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_VERY_SECRET_KEY_REPLACE_LATER';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Получаем токен из заголовка
      token = req.headers.authorization.split(' ')[1];

      // Верифицируем токен
      const decoded = jwt.verify(token, JWT_SECRET);

      // Ищем пользователя в БД по ID из токена и прикрепляем его к req
      // Исключаем поле hashed_password из выборки
      // Добавляем 'role' в выборку
      const user = await knex('users').where({ id: decoded.userId }).select('id', 'username', 'email', 'role', 'created_at', 'updated_at').first();

      if (!user) {
        return res.status(401).json({ message: 'Пользователь не найден, авторизация отклонена' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Ошибка аутентификации:', error);
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Токен недействителен' });
      }
      return res.status(401).json({ message: 'Нет авторизации, ошибка токена' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Нет токена, авторизация отклонена' });
  }
};

const authorize = (roles = []) => {
  // roles param can be a single role string (e.g., 'admin')
  // or an array of roles (e.g., ['admin', 'editor'])
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      // Это не должно произойти, если protect отработал корректно и роль всегда есть у пользователя
      return res.status(403).json({ message: 'Ошибка: роль пользователя не определена в токене или данных пользователя.' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      // user's role is not authorized
      return res.status(403).json({ message: 'Доступ запрещен: недостаточные права.' });
    }

    // authentication and authorization successful
    next();
  };
};
module.exports = { protect, authorize };