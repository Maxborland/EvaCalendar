import request from 'supertest';
const db = require('../db.cjs'); // Импортируем db напрямую
const { app } = require('../index.js'); // Импортируем app и server напрямую

// Устанавливаем NODE_ENV до всех импортов, которые могут от него зависеть
process.env.NODE_ENV = 'test';



describe('Task API', () => {
  let childUuid;
  let categoryUuid;

  beforeEach(async () => {
    // Создаем тестового ребенка и категорию расхода для внешних ключей
    const createChildRes = await request(app)
      .post('/children')
      .send({
        childName: 'Тестовый Ребенок для Задачи',
        parentName: 'Тестовый Родитель',
        parentPhone: '1234567890',
        address: 'Тестовый Адрес',
        hourlyRate: 100.00,
        comment: 'Тестовый Комментарий',
      });
    childUuid = createChildRes.body.uuid; // Исправлено на uuid

    const createCategoryRes = await request(app)
      .post('/expense-categories')
      .send({ category_name: 'Тестовая Категория для Задачи' });
    categoryUuid = createCategoryRes.body.uuid; // Исправлено на uuid
  });

  const baseTask = {
    type: 'babysitting',
    title: 'Тестовая Задача',
    // description: 'Test task description', // Удалено, используется comments
    dueDate: '2025-05-30',
    time: new Date().toISOString(),
    childId: null,
    hoursWorked: 5,
    amountEarned: 75,
    amountSpent: 25,
    comments: 'Тестовые комментарии',
    expenceTypeId: null,
  };

  it('should create a new task', async () => {
    const taskData = {
      ...baseTask,
      childId: childUuid,
      expenceTypeId: categoryUuid,
    };
    const res = await request(app)
      .post('/tasks')
      .send(taskData);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('uuid');
    expect(res.body.title).toEqual(taskData.title);
  });

  it('should get all tasks', async () => {
    const taskData = { ...baseTask, childId: childUuid, expenceTypeId: categoryUuid };
    await request(app).post('/tasks').send(taskData);
    await request(app).post('/tasks').send({ ...taskData, title: 'Другая Задача' });

    const res = await request(app)
      .get(`/tasks`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.some(task => task.title === taskData.title)).toBeTruthy();
    expect(res.body.some(task => task.title === 'Другая Задача')).toBeTruthy();
  });

  it('should get a task by UUID', async () => {
    const createRes = await request(app).post('/tasks').send({ ...baseTask, childId: childUuid, expenceTypeId: categoryUuid });
    const uuidToRetrieve = createRes.body.uuid;

    const res = await request(app)
      .get(`/tasks/${uuidToRetrieve}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('uuid', uuidToRetrieve);
    expect(res.body.title).toEqual(baseTask.title);
  });

  it('should update a task', async () => {
    const createRes = await request(app).post('/tasks').send({ ...baseTask, childId: childUuid, expenceTypeId: categoryUuid });
    const taskId = createRes.body.uuid;

    const updatedTaskData = {
      type: 'babysitting', // Добавлено обязательное поле
      title: 'Обновленная Задача',
      // description: 'Updated task description', // Удалено
      comments: 'Updated task comments', // Используем comments
      dueDate: '2025-05-31',
      amountEarned: 100,
    };

    const res = await request(app)
      .put(`/tasks/${taskId}`)
      .send(updatedTaskData);
    expect(res.statusCode).toEqual(200);
    // Сервис возвращает количество обновленных записей, а не сам объект
    // Поэтому проверяем, что ответ содержит число (количество обновленных записей)
    expect(typeof res.body).toBe('number');
    // Дополнительно можно проверить, что была обновлена 1 запись
    expect(res.body).toEqual(1);

    // Проверим, что задача действительно обновилась, запросив ее снова
    const getRes = await request(app).get(`/tasks/${taskId}`);
    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body.title).toEqual(updatedTaskData.title);
    expect(getRes.body.amountEarned).toEqual(updatedTaskData.amountEarned);
    expect(getRes.body.comments).toEqual(updatedTaskData.comments);
  });

  // it('should duplicate a task', async () => {
  //   const createRes = await request(app).post('/tasks').send({ ...baseTask, childId: childUuid, expenceTypeId: categoryUuid });
  //   const taskId = createRes.body.uuid;
  //
  //   const res = await request(app)
  //     .post(`/tasks/${taskId}/duplicate`);
  //   expect(res.statusCode).toEqual(201);
  //   expect(res.body).toHaveProperty('uuid');
  //   expect(res.body.uuid).not.toEqual(taskId);
  //   expect(res.body.title).toEqual(baseTask.title);
  // });

  it('should delete a task', async () => {
    const createRes = await request(app).post('/tasks').send({ ...baseTask, childId: childUuid, expenceTypeId: categoryUuid });
    const taskId = createRes.body.uuid;

    const res = await request(app)
      .delete(`/tasks/${taskId}`);
    expect(res.statusCode).toEqual(204);

    const checkRes = await request(app)
      .get(`/tasks/${taskId}`);
    expect(checkRes.statusCode).toEqual(404);
  });

  // Дополнительные тесты на валидацию, если они отсутствуют в текущем контроллере для tasks
  it('should return 400 if type is missing when creating a task', async () => {
    const invalidTask = { ...baseTask, type: undefined };
    const res = await request(app)
      .post('/tasks')
      .send(invalidTask);
    expect(res.statusCode).toEqual(400); // Ожидаем 400, если контроллер валидирует
  });

  it('should return 400 if required fields are missing when creating a task', async () => {
    const requiredFields = ['title', 'dueDate']; // description удалено
    for (const field of requiredFields) {
      const invalidTask = { ...baseTask, type: 'someType' }; // type обязателен
      delete invalidTask[field];
      const res = await request(app)
        .post('/tasks')
        .send(invalidTask);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message'); // Проверяем наличие сообщения об ошибке
    }
  });

  it('should return 404 if task not found when updating', async () => {
    const res = await request(app)
      .put('/tasks/00000000-0000-0000-0000-000000000000')
      .send({ ...baseTask, title: 'Non Existent', type: 'someType' }); // Добавляем обязательные поля
    expect(res.statusCode).toEqual(404);
  });

  it('should return 404 if task not found when deleting', async () => {
    const res = await request(app).delete('/tasks/00000000-0000-0000-0000-000000000000');
    expect(res.statusCode).toEqual(404);
  });
});