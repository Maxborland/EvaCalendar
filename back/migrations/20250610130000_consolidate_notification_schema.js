'use strict';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Проверяем существование таблицы
  const tableExists = await knex.schema.hasTable('notification_subscriptions');

  if (!tableExists) {
    // Создаем новую таблицу с правильной структурой
    return knex.schema.createTable('notification_subscriptions', function(table) {
      table.uuid('uuid').primary();
      table.uuid('user_uuid').notNullable().references('uuid').inTable('users').onDelete('CASCADE');
      table.text('endpoint').notNullable().unique();
      table.json('keys').notNullable();
      table.timestamps(true, true);
      table.index('user_uuid');
    });
  } else {
    // Если таблица существует, проверяем и исправляем структуру
    const hasUserIdColumn = await knex.schema.hasColumn('notification_subscriptions', 'user_id');
    const hasUserUuidColumn = await knex.schema.hasColumn('notification_subscriptions', 'user_uuid');

    if (hasUserIdColumn && !hasUserUuidColumn) {
      // Переименовываем user_id в user_uuid
      await knex.schema.alterTable('notification_subscriptions', function(table) {
        table.renameColumn('user_id', 'user_uuid');
      });
    }

    // Проверяем наличие колонки uuid (PK)
    const hasUuidColumn = await knex.schema.hasColumn('notification_subscriptions', 'uuid');
    const hasIdColumn = await knex.schema.hasColumn('notification_subscriptions', 'id');

    if (!hasUuidColumn && hasIdColumn) {
      // Если есть id вместо uuid, нужно пересоздать таблицу
      // Сохраняем данные
      const data = await knex('notification_subscriptions').select('*');

      // Удаляем старую таблицу
      await knex.schema.dropTable('notification_subscriptions');

      // Создаем новую таблицу с правильной структурой
      await knex.schema.createTable('notification_subscriptions', function(table) {
        table.uuid('uuid').primary();
        table.uuid('user_uuid').notNullable().references('uuid').inTable('users').onDelete('CASCADE');
        table.text('endpoint').notNullable().unique();
        table.json('keys').notNullable();
        table.timestamps(true, true);
        table.index('user_uuid');
      });

      // Восстанавливаем данные с генерацией UUID
      if (data.length > 0) {
        const { v4: uuidv4 } = require('uuid');
        const dataToInsert = data.map(row => ({
          uuid: uuidv4(),
          user_uuid: row.user_uuid || row.user_id,
          endpoint: row.endpoint,
          keys: row.keys,
          created_at: row.created_at || knex.fn.now(),
          updated_at: row.updated_at || knex.fn.now()
        }));
        await knex('notification_subscriptions').insert(dataToInsert);
      }
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // Откат этой миграции удаляет таблицу
  return knex.schema.dropTableIfExists('notification_subscriptions');
};