exports.up = function(knex) {
  return knex.schema.table('notification_subscriptions', function(table) {
    table.text('endpoint').unique();
  });
};

exports.down = function(knex) {
  return knex.schema.table('notification_subscriptions', function(table) {
    table.dropColumn('endpoint');
  });
};
