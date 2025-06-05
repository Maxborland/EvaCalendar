// Рекомендуемое имя файла: YYYYMMDDHHMMSS_create_users_and_password_reset_tokens.js
// (где YYYYMMDDHHMMSS - текущая дата и время, генерируется Knex CLI)
// Поместить в директорию: back/migrations/

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Создание таблицы users
  await knex.schema.createTable('users', function(table) {
    table.uuid('uuid').primary(); // UUID, PRIMARY KEY
    table.string('username').unique().notNullable(); // TEXT, UNIQUE, NOT NULL
    table.string('email').unique().notNullable(); // TEXT, UNIQUE, NOT NULL
    table.string('hashed_password').notNullable(); // TEXT, NOT NULL
    table.timestamps(true, true); // Создает created_at и updated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
  });

  // Создание таблицы password_reset_tokens
  await knex.schema.createTable('password_reset_tokens', function(table) {
    table.increments('id').primary(); // INTEGER, PRIMARY KEY, AUTOINCREMENT
    table.uuid('user_uuid')         // UUID, NOT NULL
         .notNullable()
         .references('uuid')           // FOREIGN KEY (user_uuid)
         .inTable('users')           // REFERENCES users(uuid)
         .onDelete('CASCADE');       // ON DELETE CASCADE
    table.string('token').unique().notNullable(); // TEXT, UNIQUE, NOT NULL
    table.timestamp('expires_at').notNullable(); // TIMESTAMP, NOT NULL
    table.timestamp('created_at').defaultTo(knex.fn.now()); // TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Сначала удаляем таблицу password_reset_tokens, так как она ссылается на users
  await knex.schema.dropTableIfExists('password_reset_tokens');

  // Затем удаляем таблицу users (с новым uuid PK)
  await knex.schema.dropTableIfExists('users');

  // Воссоздаем таблицу users в ее первоначальном виде (с id PK)
  await knex.schema.createTable('users', function(table) {
    table.increments('id').primary(); // INTEGER, PRIMARY KEY, AUTOINCREMENT
    table.string('username').unique().notNullable(); // TEXT, UNIQUE, NOT NULL
    table.string('email').unique().notNullable(); // TEXT, UNIQUE, NOT NULL
    table.string('hashed_password').notNullable(); // TEXT, NOT NULL
    table.timestamps(true, true); // Создает created_at и updated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
  });

  // Воссоздаем таблицу password_reset_tokens, ссылающуюся на users.id
  await knex.schema.createTable('password_reset_tokens', function(table) {
    table.increments('id').primary(); // INTEGER, PRIMARY KEY, AUTOINCREMENT
    table.integer('user_id')         // INTEGER, NOT NULL
         .unsigned()
         .notNullable()
         .references('id')           // FOREIGN KEY (user_id)
         .inTable('users')           // REFERENCES users(id)
         .onDelete('CASCADE');       // ON DELETE CASCADE
    table.string('token').unique().notNullable(); // TEXT, UNIQUE, NOT NULL
    table.timestamp('expires_at').notNullable(); // TIMESTAMP, NOT NULL
    table.timestamp('created_at').defaultTo(knex.fn.now()); // TIMESTAMP, DEFAULT CURRENT_TIMESTAMP
  });
};