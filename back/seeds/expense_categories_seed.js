exports.seed = async function(knex) {
  const { v4: uuidv4 } = require('uuid');
  // Deletes ALL existing entries
  await knex('expense_categories').del();

  // Inserts seed entries
  await knex('expense_categories').insert([
    { uuid: uuidv4(), categoryName: '🛒' }, // Продукты
    { uuid: uuidv4(), categoryName: '🚌' }, // Транспорт
    { uuid: uuidv4(), categoryName: '🎉' }, // Развлечения
    { uuid: uuidv4(), categoryName: '👗' }, // Одежда
    { uuid: uuidv4(), categoryName: '🎓' }, // Образование
    { uuid: uuidv4(), categoryName: '💊' }, // Здоровье
    { uuid: uuidv4(), categoryName: '🏠' }, // Коммунальные услуги
    { uuid: uuidv4(), categoryName: '🎁' }, // Подарки
    { uuid: uuidv4(), categoryName: '🍽️' }, // Рестораны и кафе
    { uuid: uuidv4(), categoryName: '🔨' }, // Дом и ремонт
  ]);
};