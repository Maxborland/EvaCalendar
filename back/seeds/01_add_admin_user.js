const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const SALT_ROUNDS = 10;

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('users').where({ username: 'admin' }).orWhere({ email: 'admin@example.com' }).del();

  const hashedPassword = await bcrypt.hash('StrongAdminP@ssw0rd!', SALT_ROUNDS);

  await knex('users').insert([
    {
      uuid: uuidv4(),
      username: 'admin',
      email: 'admin@example.com',
      hashed_password: hashedPassword,
      role: 'admin'
    }
  ]);
};
