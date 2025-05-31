exports.up = function(knex) {
  return knex.schema.createTable('notes', function(table) {
    table.uuid('uuid').primary().notNullable(); // Изменено с increments на uuid
    table.date('date').notNullable();
    table.text('content');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notes');
};