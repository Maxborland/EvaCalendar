exports.seed = async function(knex) {
  const { v4: uuidv4 } = require('uuid');
  // Deletes ALL existing entries
  await knex('expense_categories').del();

  // Inserts seed entries
  await knex('expense_categories').insert([
    { uuid: uuidv4(), category_name: 'Продукты' },
    { uuid: uuidv4(), category_name: 'Транспорт' },
    { uuid: uuidv4(), category_name: 'Развлечения' },
    { uuid: uuidv4(), category_name: 'Одежда' },
    { uuid: uuidv4(), category_name: 'Образование' },
    { uuid: uuidv4(), category_name: 'Здоровье' },
    { uuid: uuidv4(), category_name: 'Коммунальные услуги' },
    { uuid: uuidv4(), category_name: 'Подарки' },
    { uuid: uuidv4(), category_name: 'Рестораны и кафе' },
    { uuid: uuidv4(), category_name: 'Дом и ремонт' },
  ]);
};