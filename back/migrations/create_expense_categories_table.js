exports.up = function(knex) {
  return knex.schema.createTable('expense_categories', function(table) {
    table.uuid('uuid').primary().notNullable(); // Изменено с increments на uuid
    table.string('category_name').notNullable().unique();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('expense_categories');
};