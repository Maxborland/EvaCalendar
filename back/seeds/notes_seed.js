exports.seed = async function(knex) {
  const { v4: uuidv4 } = require('uuid');
  await knex('notes').del();

  await knex('notes').insert([
    { uuid: uuidv4(), date: '2025-05-05', content: 'Совещание с командой о планах на месяц.' },
    { uuid: uuidv4(), date: '2025-05-26', content: 'Список покупок: молоко, хлеб, яйца.' }
  ]);
};