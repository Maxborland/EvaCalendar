exports.up = function(knex) {
  return knex.schema.createTable('tasks', function(table) {
    table.uuid('uuid').primary().notNullable(); // Изменено с increments на uuid
    table.string('type').notNullable();
    table.string('title').notNullable();
    table.date('dueDate').notNullable(); // Добавляем обязательное поле
    table.datetime('time').nullable();
    table.uuid('childId').nullable().references('uuid').inTable('children').onDelete('CASCADE'); // Изменено с integer на uuid, и references на uuid
    table.integer('hoursWorked');
    table.float('amountEarned');
    table.float('amountSpent');
    table.text('comments');
    table.uuid('expenceTypeId').nullable().references('uuid').inTable('expense_categories').onDelete('RESTRICT');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tasks');
};