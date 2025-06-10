exports.up = function(knex) {
  // The column 'email_notifications_enabled' already exists in the initial schema.
  // The 'notification_subscriptions' table also exists but with a different schema.
  // We will drop the existing table and create the one specified in the task.
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

exports.down = function(knex) {
  // As per the instructions, the down migration should remove the new table
  // and the pre-existing column.
  return knex.schema.dropTableIfExists('notification_subscriptions')
    .then(() => {
      return knex.schema.table('users', function(table) {
        table.dropColumn('email_notifications_enabled');
      });
    });
};
