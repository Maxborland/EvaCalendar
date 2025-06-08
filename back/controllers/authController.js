const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const knex = require('../db.cjs');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;

if (process.env.NODE_ENV === 'production' && !JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in production environment.');
  process.exit(1); // Останавливаем приложение, если секрет не задан в production
}

// POST /api/auth/register
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Все поля (username, email, password) обязательны для заполнения.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Пароль должен содержать не менее 8 символов.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Некорректный формат email.' });
    }

    const existingUserByUsername = await knex('users').where({ username }).first();
    if (existingUserByUsername) {
      return res.status(409).json({ message: 'Пользователь с таким именем уже существует.' });
    }

    const existingUserByEmail = await knex('users').where({ email }).first();
    if (existingUserByEmail) {
      return res.status(409).json({ message: 'Пользователь с таким email уже существует.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const [newUser] = await knex('users')
      .insert({
        username,
        email,
        hashed_password: hashedPassword,
        uuid: uuidv4(),
      })
      .returning(['uuid', 'username', 'email', 'created_at', 'updated_at', 'role']);

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован.',
      user: newUser,
    });
  } catch (error) {
    console.error('Ошибка при регистрации пользователя:', error);
    // Используем next(error) для передачи ошибки в централизованный обработчик, если он есть
    // или возвращаем общую ошибку сервера
    if (next) {
        return next(error);
    }
    res.status(500).json({ message: 'Внутренняя ошибка сервера при регистрации.' });
  }
};

// POST /api/auth/login
const loginUser = async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] - Starting login for: ${req.body.identifier}, User-Agent: ${req.headers['user-agent']}`);
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Поля identifier (email или username) и password обязательны для заполнения.' });
    }

    let user = await knex('users').where({ email: identifier }).first();
    if (!user) {
      user = await knex('users').where({ username: identifier }).first();
    }

    if (!user) {
      return res.status(401).json({ message: 'Неверные учетные данные.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashed_password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Неверные учетные данные.' });
    }

    const token = jwt.sign(
      { userId: user.uuid, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Убедимся, что user.uuid существует, если нет, возможно, пользователь старый и его нужно обновить
    // или обработать эту ситуацию. В данном случае, после миграции, uuid должен быть.
    if (!user.uuid) {
        // Этого не должно произойти после миграции, но на всякий случай
        console.error(`User with id ${user.id} is missing uuid after login attempt.`);
        return res.status(500).json({ message: 'Ошибка конфигурации пользователя: отсутствует UUID.' });
    }

    res.status(200).json({
      message: 'Вход выполнен успешно.',
      token,
      user: {
        uuid: user.uuid,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Ошибка при входе пользователя:', error);
    if (next) {
      return next(error);
    }
    res.status(500).json({ message: 'Внутренняя ошибка сервера при входе.' });
  }
};

// POST /api/auth/logout
const logoutUser = async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] - Starting logout. User-Agent: ${req.headers['user-agent']}`);
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      // Декодируем токен, чтобы получить время истечения (exp)
      // jwt.decode не проверяет подпись, что нормально для этой цели,
      // так как токен уже был проверен middleware protect при доступе к этому эндпоинту,
      // либо это публичный эндпоинт, но мы все равно хотим заблокировать токен, если он предоставлен.
      // Однако, для logout, который должен быть защищенным, токен уже должен быть валидным.
      const decodedToken = jwt.decode(token);

      if (decodedToken && decodedToken.exp) {
        const expiresAt = new Date(decodedToken.exp * 1000); // exp в секундах, Date ожидает миллисекунды

        // Проверяем, не истек ли токен уже, чтобы не добавлять лишние записи
        if (expiresAt > new Date()) {
          await knex('token_blacklist').insert({
            token: token,
            expires_at: expiresAt,
          });
        }
      } else {
        // Если токен не может быть декодирован или не содержит exp,
        // это может быть невалидный токен, но мы все равно можем попытаться его добавить,
        // если хотим быть сверхагрессивными, или просто проигнорировать.
        // Для простоты, если нет exp, не добавляем, т.к. не знаем, когда он истечет.
      }
    }
    // Независимо от того, был ли токен предоставлен или обработан,
    // клиент должен удалить токен на своей стороне.
    res.status(200).json({ message: 'Вы успешно вышли из системы' });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] - Error during logout (adding token to blacklist). User-Agent: ${req.headers['user-agent']}`, error);
    if (next) {
      return next(error);
    }
    res.status(500).json({ message: 'Внутренняя ошибка сервера при выходе.' });
  }
};
module.exports = {
  registerUser,
  loginUser,
  logoutUser,
};