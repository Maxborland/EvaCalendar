export function up(knex) {
  return knex.schema.createTable('expense_categories', function(table) {
    table.increments('uuid').primary();
    table.string('category_name').notNullable().unique();
  });
}

export function down(knex) {
  return knex.schema.dropTable('expense_categories');
}