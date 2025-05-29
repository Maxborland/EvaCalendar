import request from 'supertest';
import db from '../db.js'; // Импортируем db напрямую
import { app, server } from '../index.js'; // Импортируем app и server напрямую

// Устанавливаем NODE_ENV до всех импортов, которые могут от него зависеть
process.env.NODE_ENV = 'test';


beforeAll(async () => {
  // Миграции должны применяться к импортированному db
  await db.migrate.latest();
});

afterAll(async () => {
  await db.migrate.rollback();
  await db.destroy(); // Закрываем соединение с БД
  return new Promise(resolve => server.close(resolve)); // Убедимся, что сервер закрыт
});

describe('Task API', () => {
  let taskId;
  let weekId;

  // Создаем неделю для тестирования
  // Этот блок beforeAll должен выполняться после основного beforeAll,
  // чтобы миграции уже были применены
  beforeAll(async () => {
    // Очистим таблицы перед тестами, чтобы избежать конфликтов от предыдущих запусков
    await db('tasks').del();
    await db('weeks').del();

    const week = await db('weeks').insert({
      startDate: '2025-01-01',
      endDate: '2025-01-07',
    }).returning('id');
    // В SQLite `returning` может не работать как ожидается или возвращать массив ID.
    // Если week[0] объект, то id в нем. Если просто ID, то week[0] и есть ID.
    const resultId = week[0];
    weekId = typeof resultId === 'object' ? resultId.id : resultId;
  });

  it('should create a new task', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({
        weekId: weekId,
        dayOfWeek: 'Понедельник',
        type: 'babysitting',
        title: 'Test Task',
        time: '10:00',
        address: 'Test Address',
        childName: 'Test Child',
        hourlyRate: 15,
        comments: 'Test comments',
        category: null,
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toEqual('Test Task');
    taskId = res.body.id;
  });

  it('should fetch tasks by week and day', async () => {
    const res = await request(app)
      .get(`/tasks/${weekId}/Понедельник`); // Исправлено
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].title).toEqual('Test Task');
  });

  it('should update a task', async () => {
    const res = await request(app)
      .put(`/tasks/${taskId}`)
      .send({
        title: 'Updated Task',
        hourlyRate: 20,
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.title).toEqual('Updated Task');
    expect(res.body.hourlyRate).toEqual(20);
  });

  it('should duplicate a task', async () => {
    const res = await request(app)
      .post(`/tasks/${taskId}/duplicate`);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.id).not.toEqual(taskId);
    expect(res.body.title).toEqual('Updated Task'); // Duplicated task should have the updated title
  });

  it('should move a task', async () => {
    const res = await request(app)
      .put('/tasks/move')
      .send({
        taskId: taskId,
        newWeekId: weekId, // Same week for simplicity, can be a new weekId
        newDayOfWeek: 'Вторник', // Исправлено
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.dayOfWeek).toEqual('Вторник'); // Исправлено

    // Проверим, что задача переместилась
    const tasksRes = await request(app).get(`/tasks/${weekId}/Вторник`); // Исправлено
    expect(tasksRes.body.length).toBeGreaterThan(0);
    expect(tasksRes.body.some(task => task.id === taskId)).toBe(true);

    const oldDayTasksRes = await request(app).get(`/tasks/${weekId}/Понедельник`); // Исправлено
    expect(oldDayTasksRes.body.some(task => task.id === taskId)).toBe(false);
  });

  it('should delete a task', async () => {
    const res = await request(app)
      .delete(`/tasks/${taskId}`);
    expect(res.statusCode).toEqual(204);

    const checkRes = await request(app)
      .get(`/tasks/${weekId}/Вторник`); // Проверяем в новом дне, используем русское название
    expect(checkRes.statusCode).toEqual(200);
    expect(checkRes.body.find(task => task.id === taskId)).toBeUndefined();
  });
});