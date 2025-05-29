export function up(knex) {
  return knex.schema.createTable('weeks', function(table) {
    table.increments('id').primary();
    table.string('startDate').notNullable();
    table.string('endDate').notNullable();
  });
}

export function down(knex) {
  return knex.schema.dropTable('weeks');
}