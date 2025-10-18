exports.up = async function(knex) {
  // Проверяем существует ли уже колонка address
  const hasColumn = await knex.schema.hasColumn('tasks', 'address');

  if (!hasColumn) {
    await knex.schema.table('tasks', function(table) {
      table.string('address').nullable();
    });
    console.log('Added address column to tasks table');
  } else {
    console.log('Address column already exists in tasks table');
  }
};

exports.down = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('tasks', 'address');

  if (hasColumn) {
    await knex.schema.table('tasks', function(table) {
      table.dropColumn('address');
    });
    console.log('Dropped address column from tasks table');
  }
};