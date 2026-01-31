const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const knex = require('../db.cjs');
const { getEnvConfig } = require('../config/env');
const { log, error: logError } = require('../utils/logger.js');

const SALT_ROUNDS = 10;
const envConfig = getEnvConfig();
const JWT_SECRET = envConfig.jwt.secret;
const JWT_EXPIRES_IN = envConfig.jwt.expiresIn;

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
    logError('Ошибка при регистрации пользователя:', error);
    return next(error);
  }
};

// POST /api/auth/login
const loginUser = async (req, res, next) => {
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
      { expiresIn: JWT_EXPIRES_IN }
    );

    if (!user.uuid) {
      logError(`User with id ${user.id} is missing uuid after login attempt.`);
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
    logError('Ошибка при входе пользователя:', error);
    return next(error);
  }
};

// POST /api/auth/logout
const logoutUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      const decodedToken = jwt.decode(token);

      if (decodedToken && decodedToken.exp) {
        const expiresAt = new Date(decodedToken.exp * 1000);

        if (expiresAt > new Date()) {
          await knex('token_blacklist').insert({
            token: token,
            expires_at: expiresAt,
          });
        }
      }
    }
    res.status(200).json({ message: 'Вы успешно вышли из системы' });
  } catch (error) {
    logError('Error during logout (adding token to blacklist):', error);
    return next(error);
  }
};
module.exports = {
  registerUser,
  loginUser,
  logoutUser,
};
