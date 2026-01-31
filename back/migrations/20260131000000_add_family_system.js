exports.up = async function(knex) {
  if (!(await knex.schema.hasTable('families'))) {
    await knex.schema.createTable('families', function(table) {
      table.uuid('uuid').primary();
      table.string('name').notNullable();
      table.uuid('owner_uuid').notNullable().references('uuid').inTable('users').onDelete('CASCADE');
      table.timestamps(true, true);
    });
  }

  if (!(await knex.schema.hasTable('family_members'))) {
    await knex.schema.createTable('family_members', function(table) {
      table.uuid('uuid').primary();
      table.uuid('family_uuid').notNullable().references('uuid').inTable('families').onDelete('CASCADE');
      table.uuid('user_uuid').notNullable().references('uuid').inTable('users').onDelete('CASCADE');
      table.string('role').notNullable().defaultTo('member');
      table.string('status').notNullable().defaultTo('active');
      table.uuid('invited_by').nullable().references('uuid').inTable('users').onDelete('SET NULL');
      table.timestamp('invited_at').nullable();
      table.timestamp('accepted_at').nullable();
      table.unique(['family_uuid', 'user_uuid']);
      table.index('user_uuid');
    });
  }

  if (!(await knex.schema.hasTable('family_invitations'))) {
    await knex.schema.createTable('family_invitations', function(table) {
      table.uuid('uuid').primary();
      table.uuid('family_uuid').notNullable().references('uuid').inTable('families').onDelete('CASCADE');
      table.string('email').notNullable();
      table.string('token').unique().notNullable();
      table.string('status').notNullable().defaultTo('pending');
      table.timestamp('expires_at').notNullable();
      table.timestamps(true, true);
    });
  }

  const hasColumn = await knex.schema.hasColumn('tasks', 'family_uuid');
  if (!hasColumn) {
    await knex.schema.alterTable('tasks', function(table) {
      table.uuid('family_uuid').nullable().references('uuid').inTable('families').onDelete('SET NULL');
      table.index('family_uuid');
    });
  }
};

exports.down = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('tasks', 'family_uuid');
  if (hasColumn) {
    await knex.schema.alterTable('tasks', function(table) {
      table.dropIndex('family_uuid');
      table.dropForeign('family_uuid');
      table.dropColumn('family_uuid');
    });
  }

  await knex.schema.dropTableIfExists('family_invitations');
  await knex.schema.dropTableIfExists('family_members');
  await knex.schema.dropTableIfExists('families');
};
