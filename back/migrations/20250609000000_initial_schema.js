exports.up = async function(knex) {
  if (!(await knex.schema.hasTable('users'))) {
    await knex.schema.createTable('users', function(table) {
      table.uuid('uuid').primary();
      table.string('username').unique().notNullable();
      table.string('email').unique().notNullable();
      table.string('hashed_password').notNullable();
      table.string('role').notNullable().defaultTo('user');
      table.boolean('email_notifications_enabled').notNullable().defaultTo(false);
      table.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('children'))) {
    await knex.schema.createTable('children', function(table) {
      table.uuid('uuid').primary();
      table.string('childName').notNullable();
      table.string('parentName').notNullable();
      table.string('parentPhone').notNullable();
      table.string('address');
      table.float('hourlyRate');
      table.text('comment');
      table.uuid('user_uuid').references('uuid').inTable('users').onDelete('CASCADE');
    });
  }

  if (!(await knex.schema.hasTable('expense_categories'))) {
    await knex.schema.createTable('expense_categories', function(table) {
      table.uuid('uuid').primary();
      table.string('categoryName').notNullable();
      table.uuid('user_uuid').references('uuid').inTable('users').onDelete('SET NULL');
    });
  }

  if (!(await knex.schema.hasTable('tasks'))) {
    await knex.schema.createTable('tasks', function(table) {
      table.uuid('uuid').primary();
      table.string('type').notNullable().defaultTo('income');
      table.string('title').notNullable();
      table.datetime('time').nullable();
      table.integer('hoursWorked');
      table.date('dueDate').nullable();
      table.float('amountEarned');
      table.float('amountSpent');
      table.text('comments').nullable();
      table.boolean('reminder_sent').defaultTo(false);
      table.datetime('reminder_at').nullable();
      table.string('reminder_offset').nullable();
      table.uuid('user_uuid').notNullable().references('uuid').inTable('users').onDelete('CASCADE');
      table.uuid('child_uuid').nullable().references('uuid').inTable('children').onDelete('SET NULL');
      table.uuid('expense_category_uuid').nullable().references('uuid').inTable('expense_categories').onDelete('SET NULL');
      table.uuid('creator_uuid').references('uuid').inTable('users').onDelete('CASCADE');
      table.index('user_uuid');
      table.index('creator_uuid');
    });
  }

  if (!(await knex.schema.hasTable('notes'))) {
    await knex.schema.createTable('notes', function(table) {
      table.uuid('uuid').primary();
      table.date('date').notNullable();
      table.text('content');
      table.uuid('user_uuid').references('uuid').inTable('users').onDelete('CASCADE');
    });
  }

  if (!(await knex.schema.hasTable('password_reset_tokens'))) {
    await knex.schema.createTable('password_reset_tokens', function(table) {
      table.increments('id').primary();
      table.uuid('user_uuid').notNullable().references('uuid').inTable('users').onDelete('CASCADE');
      table.string('token').unique().notNullable();
      table.timestamp('expires_at').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('token_blacklist'))) {
    await knex.schema.createTable('token_blacklist', function(table) {
      table.increments('id').primary();
      table.text('token').notNullable().unique();
      table.timestamp('expires_at').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('notification_subscriptions'))) {
    await knex.schema.createTable('notification_subscriptions', function(table) {
      table.uuid('uuid').primary();
      table.uuid('user_uuid').notNullable().references('uuid').inTable('users').onDelete('CASCADE');
      table.text('endpoint').notNullable().unique();
      table.json('keys').notNullable();
      table.timestamps(true, true);
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('notification_subscriptions');
  await knex.schema.dropTableIfExists('token_blacklist');
  await knex.schema.dropTableIfExists('password_reset_tokens');
  await knex.schema.dropTableIfExists('notes');
  await knex.schema.dropTableIfExists('tasks');
  await knex.schema.dropTableIfExists('expense_categories');
  await knex.schema.dropTableIfExists('children');
  await knex.schema.dropTableIfExists('users');
};