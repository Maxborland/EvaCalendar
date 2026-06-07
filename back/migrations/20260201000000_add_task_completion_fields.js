exports.up = async function(knex) {
  const hasCompleted = await knex.schema.hasColumn('tasks', 'completed');
  const hasCompletedAt = await knex.schema.hasColumn('tasks', 'completed_at');

  if (!hasCompleted || !hasCompletedAt) {
    await knex.schema.alterTable('tasks', function(table) {
      if (!hasCompleted) {
        table.boolean('completed').notNullable().defaultTo(false);
      }
      if (!hasCompletedAt) {
        table.datetime('completed_at').nullable();
      }
    });
  }
};

exports.down = async function(knex) {
  const hasCompleted = await knex.schema.hasColumn('tasks', 'completed');
  const hasCompletedAt = await knex.schema.hasColumn('tasks', 'completed_at');

  if (hasCompleted || hasCompletedAt) {
    await knex.schema.alterTable('tasks', function(table) {
      if (hasCompletedAt) {
        table.dropColumn('completed_at');
      }
      if (hasCompleted) {
        table.dropColumn('completed');
      }
    });
  }
};
