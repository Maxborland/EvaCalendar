exports.up = function(knex) {
  return knex.schema.createTable('token_blacklist', function(table) {
    table.increments('id').primary();
    table.text('token').notNullable().unique();
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('token_blacklist');
};