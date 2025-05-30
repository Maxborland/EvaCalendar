export function up(knex) {
  return knex.schema.createTable('tasks', function(table) {
    table.increments('uuid').primary();
    table.string('type').notNullable();
    table.string('title').notNullable();
    table.datetime('time').nullable();
    table.integer('childId').unsigned().references('id').inTable('children').onDelete('CASCADE');
    table.integer('hoursWorked');
    table.float('amountEarned');
    table.float('amountSpent');
    table.text('comments');
    table.integer('expenceTypeId').unsigned().references('id').inTable('expense_categories').onDelete('RESTRICT');
  });
}

export function down(knex) {
  return knex.schema.dropTable('tasks');
}