const { v4: uuidv4 } = require('uuid');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Эта миграция сделана пустой, так как столбец uuid для таблицы users
  // теперь создается как первичный ключ в предыдущей миграции:
  // 20250604205706_create_users_and_password_reset_tokens.js
  return Promise.resolve();
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Эта миграция сделана пустой, так как столбец uuid для таблицы users
  // теперь создается как первичный ключ в предыдущей миграции:
  // 20250604205706_create_users_and_password_reset_tokens.js
  // Соответственно, откат этой операции также не требуется.
  return Promise.resolve();
};
