exports.seed = async function(knex) {
  const { v4: uuidv4 } = require('uuid');

  const adminUser = await knex('users').where({ email: 'admin@example.com' }).first();
  if (!adminUser) {
    throw new Error('Admin user with email admin@example.com not found. Please run the user seeds first.');
  }
  const adminUserUuid = adminUser.uuid;

  await knex('expense_categories').del();

  await knex('expense_categories').insert([
    { uuid: uuidv4(), categoryName: '🛒', user_uuid: adminUserUuid }, // Продукты
    { uuid: uuidv4(), categoryName: '🚌', user_uuid: adminUserUuid }, // Транспорт
    { uuid: uuidv4(), categoryName: '🎉', user_uuid: adminUserUuid }, // Развлечения
    { uuid: uuidv4(), categoryName: '👗', user_uuid: adminUserUuid }, // Одежда
    { uuid: uuidv4(), categoryName: '🎓', user_uuid: adminUserUuid }, // Образование
    { uuid: uuidv4(), categoryName: '💊', user_uuid: adminUserUuid }, // Здоровье
    { uuid: uuidv4(), categoryName: '🏠', user_uuid: adminUserUuid }, // Коммунальные услуги
    { uuid: uuidv4(), categoryName: '🎁', user_uuid: adminUserUuid }, // Подарки
    { uuid: uuidv4(), categoryName: '🍽️', user_uuid: adminUserUuid }, // Рестораны и кафе
    { uuid: uuidv4(), categoryName: '🔨', user_uuid: adminUserUuid }, // Дом и ремонт
  ]);
};