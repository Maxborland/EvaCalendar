/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('tasks', (table) => {
    table.increments('id').primary();
    table.integer('weekId').unsigned().notNullable(); // Связь с таблицей weeks
    table.string('dayOfWeek').notNullable(); // Например, 'Понедельник', 'Вторник'
    table.string('type').notNullable(); // 'babysitting', 'expense', etc.
    table.string('title', 255).notNullable();
    table.string('time', 50); // Например, '10:00 - 12:00'
    table.string('address', 255);
    table.string('childName', 255);
    table.decimal('hourlyRate', 8, 2); // Можно хранить как decimal для точности
    table.text('comments');
    table.string('category', 255); // Для трат
    table.decimal('amountEarned', 8, 2); // Для финансовых данных
    table.decimal('amountSpent', 8, 2); // Для финансовых данных

    table.foreign('weekId').references('id').inTable('weeks');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('tasks');
};
