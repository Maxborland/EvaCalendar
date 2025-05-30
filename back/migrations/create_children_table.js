export function up(knex) {
  return knex.schema.createTable('children', function(table) {
    table.increments('uuid').primary();
    table.string('childName').notNullable();
    table.string('parentName').notNullable();
    table.string('parentPhone').notNullable();
    table.string('address');
    table.float('hourlyRate');
    table.text('comment');
  });
}

export function down(knex) {
  return knex.schema.dropTable('children');
}