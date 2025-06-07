exports.up = function(knex) {
  return knex.schema.table('tasks', function(table) {
    table.timestamp('reminder_at').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('tasks', function(table) {
    table.dropColumn('reminder_at');
  });
};
