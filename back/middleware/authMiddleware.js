const jwt = require('jsonwebtoken');
const knex = require('../db.cjs');

const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_VERY_SECRET_KEY_REPLACE_LATER';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, JWT_SECRET);

      const user = await knex('users')
        .where({ uuid: decoded.userId })
        .select('uuid', 'username', 'email', 'role', 'created_at', 'updated_at')
        .first();

      if (!user || !user.uuid) {
        return res.status(401).json({ message: 'Пользователь не найден или неполные данные пользователя, авторизация отклонена' });
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
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      // Это не должно произойти, если protect отработал корректно и роль всегда есть у пользователя
      return res.status(403).json({ message: 'Ошибка: роль пользователя не определена в токене или данных пользователя.' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Доступ запрещен: недостаточные права.' });
    }

    next();
  };
};
module.exports = { protect, authorize };