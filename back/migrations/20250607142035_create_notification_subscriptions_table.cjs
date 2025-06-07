
exports.up = function(knex) {
  return knex.schema.createTable('notification_subscriptions', function(table) {
    table.uuid('uuid').primary();
    table.uuid('user_uuid').notNullable().references('uuid').inTable('users').onDelete('CASCADE');
    table.text('endpoint').notNullable().unique();
    table.string('p256dh', 255).notNullable();
    table.string('auth', 255).notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('notification_subscriptions');
};
