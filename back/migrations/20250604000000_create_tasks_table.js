exports.up = function (knex) {
  return knex.schema.createTable('tasks', function (table) {
    table.uuid('uuid').primary();
    table.string('type').notNullable();
    table.string('title').notNullable();
    table.datetime('time').nullable();
    table.integer('hoursWorked');
    table.date('dueDate').nullable();
    table.float('amountEarned');
    table.float('amountSpent');
    // Внешний ключ к users
    table.uuid('user_uuid').notNullable();
    table.foreign('user_uuid').references('uuid').inTable('users').onDelete('CASCADE');
    // Внешний ключ к children
    table.uuid('child_uuid').nullable();
    table.foreign('child_uuid').references('uuid').inTable('children').onDelete('SET NULL');
    // Внешний ключ к expense_categories
    table.uuid('expense_category_uuid').nullable();
    table.foreign('expense_category_uuid').references('uuid').inTable('expense_categories').onDelete('SET NULL');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('tasks');
};