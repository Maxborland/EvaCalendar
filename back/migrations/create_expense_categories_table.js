exports.up = function(knex) {
  return knex.schema.createTable('expense_categories', function(table) {
    table.uuid('uuid').primary();
    table.string('categoryName').notNullable(); // .unique() убрано, если не требуется глобальная уникальность имен категорий между пользователями
    table.uuid('user_uuid').nullable();
    table.foreign('user_uuid').references('uuid').inTable('users').onDelete('SET NULL');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('expense_categories');
};