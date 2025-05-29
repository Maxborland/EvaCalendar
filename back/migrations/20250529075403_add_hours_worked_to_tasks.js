/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('tasks', function(table) {
    table.decimal('hoursWorked', 8, 2); // Добавляем новый столбец для часов работы
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('tasks', function(table) {
    table.dropColumn('hoursWorked'); // Удаляем столбец при откате миграции
  });
};
