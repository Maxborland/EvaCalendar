const bcrypt = require('bcrypt'); // Используем bcrypt, как в других сидах проекта
const { v4: uuidv4 } = require('uuid');
const SALT_ROUNDS = 10;

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Удаляем пользователя, если он уже существует, чтобы избежать конфликтов
  await knex('users').where({ email: 'testuser@example.com' }).del();

  const hashedPassword = await bcrypt.hash('password123', SALT_ROUNDS);

  await knex('users').insert([
    {
      uuid: uuidv4(),
      username: 'testuser', // Можно использовать 'testuser' или извлечь из email
      email: 'testuser@example.com',
      hashed_password: hashedPassword,
      role: 'user' // Обычный пользователь
    }
  ]);
};