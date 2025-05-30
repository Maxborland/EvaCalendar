export function up(knex) {
  return knex.schema.createTable('notes', function(table) {
    table.increments('uuid').primary();
    table.date('date').notNullable();
    table.text('content');
  });
}

export function down(knex) {
  return knex.schema.dropTable('notes');
}