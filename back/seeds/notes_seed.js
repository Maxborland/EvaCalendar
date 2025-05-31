exports.seed = async function(knex) {
  const { v4: uuidv4 } = require('uuid');
  // Deletes ALL existing entries
  await knex('notes').del();

  // Inserts seed entries
  await knex('notes').insert([
    { uuid: uuidv4(), date: '2025-05-01', content: 'Совещание с командой о планах на месяц.' },
    { uuid: uuidv4(), date: '2025-05-01', content: 'Список покупок: молоко, хлеб, яйца.' },
    { uuid: uuidv4(), date: '2025-05-02', content: 'Перезвонить клиенту по поводу проекта X.' },
    { uuid: uuidv4(), date: '2025-05-03', content: 'Подготовить презентацию для следующей встречи.' },
    { uuid: uuidv4(), date: '2025-05-04', content: 'Важная заметка: Проверить статус задачи #123.' },
    { uuid: uuidv4(), date: '2025-05-05', content: 'Отправить отчет по электронной почте.' },
    { uuid: uuidv4(), date: '2025-05-06', content: 'Написать благодарственное письмо.' },
  ]);
};