const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const knex = require('../db.cjs'); // Предполагаем, что knex экспортируется из db.cjs

// @desc    Get current user
// @route   GET /api/users/me
// @access  Private
const getCurrentUser = asyncHandler(async (req, res) => {
  // req.user уже должен быть установлен middleware 'protect'
  // и содержать данные пользователя без пароля
  const user = req.user;

  if (user) {
    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
    });
  } else {
    // Эта ситуация не должна возникать, если 'protect' работает корректно
    res.status(404);
    throw new Error('Пользователь не найден');
  }
});

// @desc    Change user password
// @route   POST /api/users/me/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Пожалуйста, предоставьте текущий и новый пароли');
  }

  if (newPassword.length < 8) {
    res.status(400);
    throw new Error('Новый пароль должен содержать не менее 8 символов');
  }

  const user = await knex('users').where({ id: userId }).first();

  if (!user) {
    // Это маловероятно, если пользователь аутентифицирован через 'protect'
    res.status(404);
    throw new Error('Пользователь не найден');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.hashed_password);

  if (!isMatch) {
    res.status(401); // Или 400, в зависимости от предпочтений
    throw new Error('Неверный текущий пароль');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedNewPassword = await bcrypt.hash(newPassword, salt);

  await knex('users').where({ id: userId }).update({
    hashed_password: hashedNewPassword,
    updated_at: knex.fn.now(), // Обновляем время последнего изменения
  });

  res.status(200).json({ message: 'Пароль успешно изменен' });
});

module.exports = {
  getCurrentUser,
  changePassword,
};