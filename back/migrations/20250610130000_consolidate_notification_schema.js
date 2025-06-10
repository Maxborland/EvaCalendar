'use strict';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // Эта миграция объединяет создание и изменение схемы уведомлений.
  // 1. Удаляем старую таблицу, если она существует, для чистого старта.
  // 2. Создаем новую таблицу 'notification_subscriptions' с окончательной структурой.
  return knex.schema.dropTableIfExists('notification_subscriptions')
    .then(() => {
      return knex.schema.createTable('notification_subscriptions', function(table) {
        table.increments('id').primary();
        table.uuid('user_id').notNullable().references('uuid').inTable('users').onDelete('CASCADE');
        table.text('endpoint').notNullable().unique();
        table.json('keys').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.index('user_id');
      });
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // Откат этой объединенной миграции должен просто удалить созданную таблицу.
  return knex.schema.dropTableIfExists('notification_subscriptions');
};