exports.up = function(knex) {
  return knex.schema.table('tasks', function(table) {
    table.text('comments').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('tasks', function(table) {
    table.dropColumn('comments');
  });
};