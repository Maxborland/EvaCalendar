const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Добавляем jsonwebtoken
const knex = require('../db.cjs'); // Предполагая, что db.cjs экспортирует экземпляр knex

const SALT_ROUNDS = 10; // Рекомендуемое количество раундов для bcrypt
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_VERY_SECRET_KEY_REPLACE_LATER'; // Секретный ключ для JWT

// POST /api/auth/register
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // 1. Валидация входных данных
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Все поля (username, email, password) обязательны для заполнения.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Пароль должен содержать не менее 8 символов.' });
    }

    // Простая проверка формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Некорректный формат email.' });
    }

    // 2. Проверка уникальности username и email
    const existingUserByUsername = await knex('users').where({ username }).first();
    if (existingUserByUsername) {
      return res.status(409).json({ message: 'Пользователь с таким именем уже существует.' });
    }

    const existingUserByEmail = await knex('users').where({ email }).first();
    if (existingUserByEmail) {
      return res.status(409).json({ message: 'Пользователь с таким email уже существует.' });
    }

    // 3. Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 4. Сохранение пользователя
    const [newUser] = await knex('users')
      .insert({
        username,
        email,
        hashed_password: hashedPassword,
      })
      .returning(['id', 'username', 'email', 'created_at', 'updated_at']); // Возвращаем данные нового пользователя

    // 5. Ответ клиенту
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
  try {
    const { email, password } = req.body;

    // 1. Валидация входных данных
    if (!email || !password) {
      return res.status(400).json({ message: 'Поля email и password обязательны для заполнения.' });
    }

    // 2. Поиск пользователя по email
    const user = await knex('users').where({ email }).first();
    if (!user) {
      return res.status(401).json({ message: 'Неверные учетные данные.' }); // Общее сообщение
    }

    // 3. Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.hashed_password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Неверные учетные данные.' }); // Общее сообщение
    }

    // 4. Генерация JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' } // Токен действителен 1 час
    );

    // 5. Ответ клиенту
    res.status(200).json({
      message: 'Вход выполнен успешно.',
      token,
      userId: user.id,
      username: user.username,
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
const logoutUser = (req, res) => {
  // Поскольку JWT stateless, серверная часть для logout минимальна.
  // Клиент должен сам удалить токен.
  // В будущем можно рассмотреть черный список токенов для немедленной инвалидации.
  res.status(200).json({ message: 'Вы успешно вышли из системы' });
};
module.exports = {
  registerUser,
  loginUser,
  logoutUser, // Экспортируем новую функцию
};