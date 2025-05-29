const request = require('supertest');
// Импортируем app и server после установки NODE_ENV
let app;
let server;
const knex = require('knex');
const knexConfig = require('../knexfile');

let db;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  // Важно импортировать app и server после установки NODE_ENV (иначе они могут быть инициализированы с 'development' конфигом)
  const api = require('../index');
  app = api.app;
  server = api.server;

  db = knex(knexConfig.test); // Используем тестовый конфиг
  await db.migrate.latest(); // Применяем миграции к тестовой БД
});

afterAll(async () => {
  await db.migrate.rollback();
  await db.destroy();
  server.close();
});

describe('Task API', () => {
  let taskId;
  let weekId;

  // Создаем неделю для тестирования
  beforeAll(async () => {
    const week = await db('weeks').insert({
      startDate: '2025-01-01',
      endDate: '2025-01-07',
    }).returning('id');
    weekId = week[0].id || week[0]; // SQLite returns an array of objects with id, PostgreSQL directly returns id
  });

  it('should create a new task', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({
        weekId: weekId,
        dayOfWeek: 'Monday',
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
      .get(`/tasks/${weekId}/Monday`);
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
      .post(`/tasks/duplicate/${taskId}`);
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
        newDayOfWeek: 'Tuesday',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.dayOfWeek).toEqual('Tuesday');

    // Проверим, что задача переместилась
    const tasksRes = await request(app).get(`/tasks/${weekId}/Tuesday`);
    expect(tasksRes.body.length).toBeGreaterThan(0);
    expect(tasksRes.body.some(task => task.id === taskId)).toBe(true);

    const oldDayTasksRes = await request(app).get(`/tasks/${weekId}/Monday`);
    expect(oldDayTasksRes.body.some(task => task.id === taskId)).toBe(false);
  });

  it('should delete a task', async () => {
    const res = await request(app)
      .delete(`/tasks/${taskId}`);
    expect(res.statusCode).toEqual(204);

    const checkRes = await request(app)
      .get(`/tasks/${weekId}/Tuesday`); // Проверяем в новом дне
    expect(checkRes.statusCode).toEqual(200);
    expect(checkRes.body.find(task => task.id === taskId)).toBeUndefined();
  });
});