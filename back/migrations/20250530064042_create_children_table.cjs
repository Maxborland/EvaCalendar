
exports.up = function(knex) {
  return knex.schema.createTable('children', function(table) {
    table.increments('id').primary();
    table.string('childName').notNullable();
    table.string('parentName').notNullable();
    table.string('parentPhone');
    table.string('address');
    table.float('hourlyRate');
    table.string('comment');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('children');
};
