const jwt = require('jsonwebtoken');
const knex = require('../db.cjs');

const JWT_SECRET = process.env.JWT_SECRET;

if (process.env.NODE_ENV === 'production' && !JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in production environment.');
  process.exit(1); // Останавливаем приложение, если секрет не задан в production
}

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, JWT_SECRET);

      // Проверка, не находится ли токен в черном списке
      const blacklistedToken = await knex('token_blacklist').where({ token }).first();
      if (blacklistedToken) {
        // Убедимся, что токен все еще "действителен" по времени истечения в черном списке,
        // хотя если он там, он уже не должен быть действителен.
        // Это также помогает очищать старые токены, если бы мы делали это здесь.
        if (new Date(blacklistedToken.expires_at) > new Date()) {
            return res.status(401).json({ message: 'Токен аннулирован (в черном списке).' });
        } else {
            // Токен в черном списке, но его срок истек, можно было бы его удалить из ЧС.
            // Но для простоты, если он там - он недействителен.
            // Однако, если срок истек, то jwt.verify уже должен был выдать ошибку TokenExpiredError.
            // Эта ветка маловероятна при правильной логике добавления в ЧС.
            return res.status(401).json({ message: 'Токен аннулирован и истек (в черном списке).' });
        }
      }

      const user = await knex('users')
        .where({ uuid: decoded.userId })
        .select('uuid', 'username', 'email', 'role', 'created_at', 'updated_at')
        .first();

      if (!user || !user.uuid) {
        return res.status(401).json({ message: 'Пользователь не найден или неполные данные пользователя, авторизация отклонена' });
      }

      req.user = { ...user, id: user.uuid };
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