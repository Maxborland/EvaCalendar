import request from 'supertest';
const db = require('../db.cjs');
const { app } = require('../index.js');

process.env.NODE_ENV = 'test';



describe('Task API', () => {
  let childUuid;
  let categoryUuid;

  beforeEach(async () => {
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
    childUuid = createChildRes.body.uuid;

    const createCategoryRes = await request(app)
      .post('/expense-categories')
      .send({ categoryName: 'Тестовая Категория для Задачи' });
    categoryUuid = createCategoryRes.body.uuid;
  });

  const baseTask = {
    type: 'babysitting',
    title: 'Тестовая Задача',
    dueDate: '2025-05-30',
    time: new Date().toISOString(),
    childId: null,
    hoursWorked: 5,
    amountEarned: 75,
    amountSpent: 25,
    comments: 'Тестовые комментарии',
    expenseTypeId: null,
  };

  it('should create a new task', async () => {
    const taskData = {
      ...baseTask,
      childId: childUuid,
      expenseTypeId: categoryUuid,
    };
    const res = await request(app)
      .post('/tasks')
      .send(taskData);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('uuid');
    expect(res.body.title).toEqual(taskData.title);
  });

  it('should create a new expense task with category name and link it correctly', async () => {
    const taskData = {
      ...baseTask,
      type: 'expense',
      title: 'Тестовая Задача Расхода с Именем Категории',
      category: 'Тестовая Категория для Задачи',
    };

    const createRes = await request(app)
      .post('/tasks')
      .send(taskData);

    expect(createRes.statusCode).toEqual(201);
    expect(createRes.body).toHaveProperty('uuid');
    expect(createRes.body.title).toEqual(taskData.title);
    expect(createRes.body.type).toEqual('expense');
    expect(createRes.body).not.toHaveProperty('category');
    expect(createRes.body.expenseTypeId).toEqual(categoryUuid);

    const getRes = await request(app).get(`/tasks/${createRes.body.uuid}`);
    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body.expenseTypeId).toEqual(categoryUuid);
    expect(getRes.body).not.toHaveProperty('category');
    expect(getRes.body.expenseCategoryName).toEqual('Тестовая Категория для Задачи');
  });

  it('should return 400 when creating an expense task with a non-existent category name', async () => {
    const taskData = {
      ...baseTask,
      type: 'expense',
      title: 'Задача с Несуществующей Категорией',
      category: 'Несуществующая Категория',
    };

    const res = await request(app)
      .post('/tasks')
      .send(taskData);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', "Категория расхода 'Несуществующая Категория' не найдена");
  });

  it('should get all tasks', async () => {
    const taskData = { ...baseTask, childId: childUuid, expenseTypeId: categoryUuid };
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
    const createRes = await request(app).post('/tasks').send({ ...baseTask, childId: childUuid, expenseTypeId: categoryUuid });
    const uuidToRetrieve = createRes.body.uuid;

    const res = await request(app)
      .get(`/tasks/${uuidToRetrieve}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('uuid', uuidToRetrieve);
    expect(res.body.title).toEqual(baseTask.title);
  });

  it('should update a task', async () => {
    const createRes = await request(app).post('/tasks').send({ ...baseTask, childId: childUuid, expenseTypeId: categoryUuid });
    const taskId = createRes.body.uuid;

    const updatedTaskData = {
      type: 'babysitting',
      title: 'Обновленная Задача',
      comments: 'Updated task comments',
      dueDate: '2025-05-31',
      amountEarned: 100,
    };

    const res = await request(app)
      .put(`/tasks/${taskId}`)
      .send(updatedTaskData);
    expect(res.statusCode).toEqual(200);
    expect(typeof res.body).toBe('number');
    expect(res.body).toEqual(1);

    const getRes = await request(app).get(`/tasks/${taskId}`);
    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body.title).toEqual(updatedTaskData.title);
    expect(getRes.body.amountEarned).toEqual(updatedTaskData.amountEarned);
    expect(getRes.body.comments).toEqual(updatedTaskData.comments);
  });

  it('should delete a task', async () => {
    const createRes = await request(app).post('/tasks').send({ ...baseTask, childId: childUuid, expenseTypeId: categoryUuid });
    const taskId = createRes.body.uuid;

    const res = await request(app)
      .delete(`/tasks/${taskId}`);
    expect(res.statusCode).toEqual(204);

    const checkRes = await request(app)
      .get(`/tasks/${taskId}`);
    expect(checkRes.statusCode).toEqual(404);
  });

  it('should return 400 if type is missing when creating a task', async () => {
    const invalidTask = { ...baseTask, type: undefined };
    const res = await request(app)
      .post('/tasks')
      .send(invalidTask);
    expect(res.statusCode).toEqual(400);
  });

  it('should return 400 if required fields are missing when creating a task', async () => {
    const requiredFields = ['title', 'dueDate'];
    for (const field of requiredFields) {
      const invalidTask = { ...baseTask, type: 'someType' };
      delete invalidTask[field];
      const res = await request(app)
        .post('/tasks')
        .send(invalidTask);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
    }
  });

  it('should return 404 if task not found when updating', async () => {
    const res = await request(app)
      .put('/tasks/00000000-0000-0000-0000-000000000000')
      .send({ ...baseTask, title: 'Non Existent', type: 'someType' });
    expect(res.statusCode).toEqual(404);
  });

  it('should return 404 if task not found when deleting', async () => {
    const res = await request(app).delete('/tasks/00000000-0000-0000-0000-000000000000');
    expect(res.statusCode).toEqual(404);
  });
});