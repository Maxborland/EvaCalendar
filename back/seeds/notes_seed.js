const { v4: uuidv4 } = require('uuid');

exports.seed = async function(knex) {
  // Получаем uuid администратора
  const adminUser = await knex('users').where({ email: 'admin@example.com' }).first();
  if (!adminUser) {
    throw new Error('Admin user with email admin@example.com not found. Make sure to run the 01_add_admin_user.js seed first.');
  }
  const adminUserUuid = adminUser.uuid;

  await knex('notes').del();

  await knex('notes').insert([
    { uuid: uuidv4(), date: '2025-05-05', content: 'Совещание с командой о планах на месяц.', user_uuid: adminUserUuid },
    { uuid: uuidv4(), date: '2025-05-26', content: 'Список покупок: молоко, хлеб, яйца.', user_uuid: adminUserUuid }
  ]);
};