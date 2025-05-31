exports.seed = async function(knex) {
  const { v4: uuidv4 } = require('uuid');
  // Deletes ALL existing entries
  await knex('notes').del();

  // Inserts seed entries
  await knex('notes').insert([
    { uuid: uuidv4(), date: '2025-05-05', content: 'Совещание с командой о планах на месяц.' },
    { uuid: uuidv4(), date: '2025-05-26', content: 'Список покупок: молоко, хлеб, яйца.' }
  ]);
};