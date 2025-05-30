export async function seed(knex) {
  // Deletes ALL existing entries
  await knex('notes').del();

  // Inserts seed entries
  await knex('notes').insert([
    { date: '2025-05-01', content: 'Совещание с командой о планах на месяц.' },
    { date: '2025-05-01', content: 'Список покупок: молоко, хлеб, яйца.' },
    { date: '2025-05-02', content: 'Перезвонить клиенту по поводу проекта X.' },
    { date: '2025-05-03', content: 'Подготовить презентацию для следующей встречи.' },
    { date: '2025-05-04', content: 'Важная заметка: Проверить статус задачи #123.' },
    { date: '2025-05-05', content: 'Отправить отчет по электронной почте.' },
    { date: '2025-05-06', content: 'Написать благодарственное письмо.' },
  ]);
}