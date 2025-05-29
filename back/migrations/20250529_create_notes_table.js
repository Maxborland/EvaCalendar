export function up(knex) {
  return knex.schema.createTable('notes', function(table) {
    table.increments('id').primary();
    table.integer('weekId').unsigned().notNullable();
    table.text('content');
    table.foreign('weekId').references('id').inTable('weeks');
  });
};

export function down(knex) {
  return knex.schema.dropTable('notes');
};