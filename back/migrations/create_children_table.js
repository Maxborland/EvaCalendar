exports.up = function(knex) {
  return knex.schema.createTable('children', function(table) {
    table.uuid('uuid').primary().notNullable(); // Изменено с increments на uuid
    table.string('childName').notNullable();
    table.string('parentName').notNullable();
    table.string('parentPhone').notNullable();
    table.string('address');
    table.float('hourlyRate');
    table.text('comment');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('children');
};