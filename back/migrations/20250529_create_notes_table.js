exports.up = function(knex) {
  return knex.schema.createTable('notes', function(table) {
    table.increments('id').primary();
    table.integer('weekId').unsigned().notNullable();
    table.text('content');
    table.foreign('weekId').references('id').inTable('weeks');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notes');
};