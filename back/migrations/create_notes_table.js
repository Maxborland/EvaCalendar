exports.up = function(knex) {
  return knex.schema.createTable('notes', function(table) {
    table.uuid('uuid').primary();
    table.date('date').notNullable();
    table.text('content');
    table.uuid('user_uuid');
    table.foreign('user_uuid').references('uuid').inTable('users').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('notes');
};