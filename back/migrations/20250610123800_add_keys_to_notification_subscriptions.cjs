'use strict';

exports.up = function(knex) {
  return knex.schema.table('notification_subscriptions', function(table) {
    // Добавляем новую колонку 'keys' для хранения ключей подписки.
    // TEXT используется для хранения JSON-строки с ключами p256dh и auth.
    table.text('keys').notNullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('notification_subscriptions', function(table) {
    table.dropColumn('keys');
  });
};