const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const SALT_ROUNDS = 10; // Должно совпадать с тем, что в authController

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries in users table related to admin to avoid conflicts
  // Это важно, если сид запускается несколько раз.
  // Однако, если есть другие пользователи, которых не нужно удалять,
  // то условие where нужно уточнить или удалять только конкретного админа.
  await knex('users').where({ username: 'admin' }).orWhere({ email: 'admin@example.com' }).del();

  // Hash the admin password
  const hashedPassword = await bcrypt.hash('StrongAdminP@ssw0rd!', SALT_ROUNDS);

  // Inserts seed entries
  await knex('users').insert([
    {
      uuid: uuidv4(),
      username: 'admin',
      email: 'admin@example.com',
      hashed_password: hashedPassword,
      role: 'admin' // Устанавливаем роль администратора
    }
  ]);
};
