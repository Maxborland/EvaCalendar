const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const knex = require('../db.cjs');

// @desc    Get current user
// @route   GET /api/users/me
// @access  Private
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user && user.uuid) {
    res.status(200).json({
      uuid: user.uuid,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    });
  } else {
    res.status(404);
    throw new Error('Пользователь не найден или информация о пользователе неполная.');
  }
});

// @desc    Change user password
// @route   POST /api/users/me/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userUuid = req.user.uuid;

  if (!userUuid) {
    res.status(401);
    throw new Error('Не удалось идентифицировать пользователя для смены пароля.');
  }

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Пожалуйста, предоставьте текущий и новый пароли');
  }

  if (newPassword.length < 8) {
    res.status(400);
    throw new Error('Новый пароль должен содержать не менее 8 символов');
  }

  const user = await knex('users').where({ uuid: userUuid }).first();

  if (!user) {
    res.status(404);
    throw new Error('Пользователь не найден');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.hashed_password);

  if (!isMatch) {
    res.status(401);
    throw new Error('Неверный текущий пароль');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedNewPassword = await bcrypt.hash(newPassword, salt);

  await knex('users').where({ uuid: userUuid }).update({
    hashed_password: hashedNewPassword,
    updated_at: knex.fn.now(),
  });

  res.status(200).json({ message: 'Пароль успешно изменен' });
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await knex('users').select('uuid', 'username', 'email', 'role', 'created_at', 'updated_at');
  res.status(200).json(users);
});

// @desc    Create a new user
// @route   POST /api/users
// @access  Private (Admin)
const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    res.status(400);
    throw new Error('Пожалуйста, предоставьте username, email, password и role');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Некорректный формат email');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Пароль должен содержать не менее 6 символов');
  }

  if (!['user', 'admin'].includes(role)) {
    res.status(400);
    throw new Error("Роль должна быть 'user' или 'admin'");
  }

  const existingUserByUsername = await knex('users').where({ username }).first();
  if (existingUserByUsername) {
    res.status(409);
    throw new Error('Пользователь с таким именем уже существует');
  }

  const existingUserByEmail = await knex('users').where({ email }).first();
  if (existingUserByEmail) {
    res.status(409);
    throw new Error('Пользователь с таким email уже существует');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const [newUser] = await knex('users')
    .insert({
      username,
      email,
      hashed_password: hashedPassword,
      role,
      uuid: uuidv4(),
    })
    .returning(['uuid', 'username', 'email', 'role', 'created_at', 'updated_at']);

  res.status(201).json({
    uuid: newUser.uuid,
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
    created_at: newUser.created_at,
    updated_at: newUser.updated_at,
  });
});

// @desc    Get user by UUID
// @route   GET /api/users/:uuid
// @access  Private (Admin)
const getUserById = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  const user = await knex('users')
    .select('uuid', 'username', 'email', 'role', 'created_at', 'updated_at')
    .where({ uuid })
    .first();

  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404);
    throw new Error('Пользователь не найден');
  }
});

// @desc    Update user by UUID
// @route   PUT /api/users/:uuid
// @access  Private (Admin)
const updateUser = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  const { username, email, role } = req.body;

  if (!username && !email && !role) {
    res.status(400);
    throw new Error('Необходимо предоставить хотя бы одно поле для обновления: username, email или role.');
  }

  const updateData = {};
  if (username) updateData.username = username;
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400);
      throw new Error('Некорректный формат email');
    }
    const existingUserByEmail = await knex('users').where({ email }).whereNot({ uuid }).first();
    if (existingUserByEmail) {
      res.status(409);
      throw new Error('Пользователь с таким email уже существует');
    }
    updateData.email = email;
  }
  if (role) {
    if (!['user', 'admin'].includes(role)) {
      res.status(400);
      throw new Error("Роль должна быть 'user' или 'admin'");
    }
    // Проверка, что администратор не пытается изменить свою роль через этот эндпоинт, если uuid совпадает с его uuid
    if (req.user.uuid === uuid && req.user.role !== role) {
        res.status(403);
        throw new Error("Администратор не может изменить свою собственную роль этим способом. Используйте соответствующий эндпоинт или обратитесь к другому администратору.");
    }
    updateData.role = role;
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ message: "Нет данных для обновления." });
  }

  updateData.updated_at = knex.fn.now();

  const [updatedUser] = await knex('users')
    .where({ uuid })
    .update(updateData)
    .returning(['uuid', 'username', 'email', 'role', 'created_at', 'updated_at']);

  if (updatedUser) {
    res.status(200).json(updatedUser);
  } else {
    res.status(404);
    throw new Error('Пользователь не найден для обновления');
  }
});

// @desc    Delete user by UUID
// @route   DELETE /api/users/:uuid
// @access  Private (Admin)
const deleteUser = asyncHandler(async (req, res) => {
  const { uuid: userUuidToDelete } = req.params;
  const adminUserUuid = req.user.uuid;

  if (!adminUserUuid) {
    res.status(401);
    throw new Error('Не удалось идентифицировать администратора.');
  }

  // Проверка, что администратор не пытается удалить сам себя
  if (userUuidToDelete === adminUserUuid) {
    res.status(403);
    throw new Error('Администратор не может удалить сам себя.');
  }

  const userToDelete = await knex('users').where({ uuid: userUuidToDelete }).first();

  if (!userToDelete) {
    res.status(404);
    throw new Error('Пользователь не найден.');
  }

  await knex('users').where({ uuid: userUuidToDelete }).del();

  res.status(200).json({ message: `Пользователь ${userToDelete.username} (UUID: ${userUuidToDelete}) успешно удален.` });
});

// @desc    Change user role by UUID
// @route   PUT /api/users/:userUuid/role
// @access  Private (Admin)
const changeUserRole = asyncHandler(async (req, res) => {
  const { userUuid } = req.params;
  const { role } = req.body;
  const adminUserUuid = req.user.uuid;

  if (!adminUserUuid) {
    res.status(401);
    throw new Error('Не удалось идентифицировать администратора.');
  }

  if (!role) {
    res.status(400);
    throw new Error('Пожалуйста, укажите новую роль');
  }
  if (!['user', 'admin'].includes(role)) {
    res.status(400);
    throw new Error("Роль должна быть 'user' или 'admin'");
  }

  if (adminUserUuid === userUuid) {
    res.status(403);
    throw new Error('Администратор не может изменить свою собственную роль этим способом.');
  }

  const userToUpdate = await knex('users').where({ uuid: userUuid }).first();

  if (!userToUpdate) {
    res.status(404);
    throw new Error('Пользователь не найден');
  }

  await knex('users').where({ uuid: userUuid }).update({
    role: role,
    updated_at: knex.fn.now(),
  });

  res.status(200).json({ message: `Роль пользователя ${userToUpdate.username} (UUID: ${userUuid}) успешно изменена на ${role}` });
});

// @desc    Admin changes user password by UUID
// @route   PUT /api/users/:userUuid/password
// @access  Private (Admin)
const adminChangeUserPassword = asyncHandler(async (req, res) => {
  const { userUuid } = req.params;
  const { newPassword } = req.body;
  const adminUserUuid = req.user.uuid;

  if (!adminUserUuid) {
    res.status(401);
    throw new Error('Не удалось идентифицировать администратора.');
  }

  if (!newPassword) {
    res.status(400);
    throw new Error('Пожалуйста, предоставьте новый пароль');
  }

  if (newPassword.length < 8) {
    res.status(400);
    throw new Error('Новый пароль должен содержать не менее 8 символов');
  }

  if (adminUserUuid === userUuid) {
    res.status(403);
    throw new Error('Администратор не может изменить свой собственный пароль этим способом. Используйте эндпоинт смены своего пароля.');
  }

  const userToUpdate = await knex('users').where({ uuid: userUuid }).first();

  if (!userToUpdate) {
    res.status(404);
    throw new Error('Пользователь не найден');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedNewPassword = await bcrypt.hash(newPassword, salt);

  await knex('users').where({ uuid: userUuid }).update({
    hashed_password: hashedNewPassword,
    updated_at: knex.fn.now(),
  });

  res.status(200).json({ message: `Пароль пользователя ${userToUpdate.username} (UUID: ${userUuid}) успешно изменен администратором` });
});

module.exports = {
  getCurrentUser,
  changePassword,
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  changeUserRole,
  adminChangeUserPassword,
};