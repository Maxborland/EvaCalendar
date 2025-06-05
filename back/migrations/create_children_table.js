exports.up = function(knex) {
  return knex.schema.createTable('children', function(table) {
    table.uuid('uuid').primary();
    table.string('childName').notNullable();
    table.string('parentName').notNullable();
    table.string('parentPhone').notNullable();
    table.string('address');
    table.float('hourlyRate');
    table.text('comment');
    table.uuid('user_uuid');
    table.foreign('user_uuid').references('uuid').inTable('users').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('children');
};