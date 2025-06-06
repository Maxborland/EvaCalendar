import request from 'supertest';
// const db = require('../db.cjs'); // db не используется напрямую в этом файле
const { app } = require('../index.js');

// process.env.NODE_ENV = 'test'; // Устанавливается в jest.setup.js

describe('Task API', () => {
  let token;
  const uniqueUser = {
    username: `testuser_tasks_${Date.now()}`,
    email: `test_tasks_${Date.now()}@example.com`,
    password: 'password123',
  };

  let childUuidForTasks;
  let categoryUuidForTasks;
  const childDataForTasks = {
    childName: 'Тестовый Ребенок для Задач API',
    parentName: 'Родитель для Задач API',
    parentPhone: '1234509876',
    address: 'Адрес для Задач API',
    hourlyRate: 120.00,
    comment: 'Ребенок для тестов задач',
  };
  const categoryDataForTasks = { categoryName: 'Тестовая Категория для Задач API' };

  beforeEach(async () => {
    const registerRes = await request(app)
      .post('/auth/register')
      .send(uniqueUser);
    expect(registerRes.statusCode).toEqual(201);

    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        identifier: uniqueUser.email,
        password: uniqueUser.password,
      });
    expect(loginRes.statusCode).toEqual(200);
    expect(loginRes.body).toHaveProperty('token');
    token = loginRes.body.token;

    const createChildRes = await request(app)
      .post('/children')
      .set('Authorization', `Bearer ${token}`)
      .send(childDataForTasks);
    expect(createChildRes.statusCode).toEqual(201);
    childUuidForTasks = createChildRes.body.uuid;

    const createCategoryRes = await request(app)
      .post('/expense-categories')
      .set('Authorization', `Bearer ${token}`)
      .send(categoryDataForTasks);
    expect(createCategoryRes.statusCode).toEqual(201);
    categoryUuidForTasks = createCategoryRes.body.uuid;
  });


  it('should create a new task (income)', async () => {
    const baseIncomeTask = {
      taskType: 'income',
      title: 'Тестовая Задача (Доход)',
      dueDate: '2025-06-15',
      time: new Date().toISOString(),
      hoursWorked: 3,
      amount: 300, // Изменено с amountEarned на amount
      comments: 'Комментарии к тестовой задаче (доход)',
    };
    const taskData = {
      ...baseIncomeTask,
      childId: childUuidForTasks,
    };
    const res = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(taskData);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('uuid');
    expect(res.body.title).toEqual(taskData.title);
    expect(res.body.child_uuid).toEqual(childUuidForTasks); // Ожидаем child_uuid
    expect(res.body.amountEarned).toEqual(taskData.amount);
  });

  it('should create a new expense task with existing categoryId', async () => {
    const baseExpenseTask = {
      taskType: 'expense',
      title: 'Тестовая Задача (Расход)',
      dueDate: '2025-06-15',
      time: new Date().toISOString(),
      amount: 50, // Изменено с amountSpent на amount
      comments: 'Комментарии к тестовой задаче (расход)',
    };
    const taskData = {
      ...baseExpenseTask,
      expenseTypeId: categoryUuidForTasks,
    };
    const res = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(taskData);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('uuid');
    expect(res.body.type).toEqual('expense');
    expect(res.body.expense_category_uuid).toEqual(categoryUuidForTasks); // Ожидаем expense_category_uuid
    expect(res.body.amountSpent).toEqual(taskData.amount);
  });

  // Этот тест адаптирован для использования существующего expenseTypeId,
  // так как сервис не поддерживает создание категории по имени при создании задачи.
  it('should create a new expense task and link it to an existing category', async () => {
    const baseExpenseTask = {
      taskType: 'expense',
      title: 'Тестовая Задача (Расход с существующей категорией)',
      dueDate: '2025-06-15',
      time: new Date().toISOString(),
      amount: 50,
      comments: 'Комментарии к тестовой задаче (расход)',
    };
    const taskData = {
      ...baseExpenseTask,
      expenseTypeId: categoryUuidForTasks, // Используем UUID созданной в beforeEach категории
    };

    const createRes = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(taskData);

    expect(createRes.statusCode).toEqual(201);
    expect(createRes.body).toHaveProperty('uuid');
    expect(createRes.body.title).toEqual(taskData.title);
    expect(createRes.body.type).toEqual('expense');
    expect(createRes.body.expense_category_uuid).toEqual(categoryUuidForTasks);

    const getRes = await request(app)
        .get(`/tasks/${createRes.body.uuid}`)
        .set('Authorization', `Bearer ${token}`);
    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body.expense_category_uuid).toEqual(categoryUuidForTasks);
    expect(getRes.body.expenseCategoryName).toEqual(categoryDataForTasks.categoryName);
  });

  // Этот тест изменен, так как сервис не должен создавать задачу с несуществующим ID категории.
  // Вместо этого он должен вернуть ошибку 400 из-за валидации в taskService.
  it('should return 400 when creating an expense task with a non-existent categoryId', async () => {
    const baseExpenseTask = {
      taskType: 'expense',
      title: 'Тестовая Задача (Расход с несуществующим ID категории)',
      dueDate: '2025-06-15',
      time: new Date().toISOString(),
      amount: 50,
      comments: 'Комментарии к тестовой задаче (расход)',
    };
    const taskData = {
      ...baseExpenseTask,
      expenseTypeId: '00000000-0000-0000-0000-000000000000', // Несуществующий UUID
    };
    const res = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(taskData);
    expect(res.statusCode).toEqual(400); // Ожидаем 400 из-за проверки в taskService
    expect(res.body).toHaveProperty('message', 'Expense category not found by categoryId');
  });

  it('should get all tasks for the authenticated user', async () => {
    const incomeTask = {
      taskType: 'income',
      title: 'Задача 1 для GET ALL',
      dueDate: '2025-06-15',
      time: new Date().toISOString(),
      hoursWorked: 3,
      amount: 300, // Изменено
      comments: 'Комментарии к тестовой задаче (доход)',
    };
    await request(app).post('/tasks').set('Authorization', `Bearer ${token}`).send({ ...incomeTask, childId: childUuidForTasks });
    const expenseTask = {
      taskType: 'expense',
      title: 'Задача 2 для GET ALL (расход)',
      dueDate: '2025-06-15',
      time: new Date().toISOString(),
      amount: 50, // Изменено
      comments: 'Комментарии к тестовой задаче (расход)',
    };
    await request(app).post('/tasks').set('Authorization', `Bearer ${token}`).send({ ...expenseTask, expenseTypeId: categoryUuidForTasks });

    const res = await request(app)
      .get(`/tasks`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.some(task => task.title === 'Задача 1 для GET ALL')).toBeTruthy();
    expect(res.body.some(task => task.title === 'Задача 2 для GET ALL (расход)')).toBeTruthy();
  });

  it('should get a task by UUID', async () => {
    const taskToCreate = {
      taskType: 'income',
      title: 'Задача для GET по UUID',
      dueDate: '2025-06-15',
      time: new Date().toISOString(),
      hoursWorked: 3,
      amount: 300, // Изменено
      comments: 'Комментарии к тестовой задаче (доход)',
    };
    const createRes = await request(app).post('/tasks').set('Authorization', `Bearer ${token}`).send({ ...taskToCreate, childId: childUuidForTasks });
    expect(createRes.statusCode).toEqual(201);
    const uuidToRetrieve = createRes.body.uuid;

    const res = await request(app)
      .get(`/tasks/${uuidToRetrieve}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('uuid', uuidToRetrieve);
    expect(res.body.title).toEqual(taskToCreate.title);
    expect(res.body.amountEarned).toEqual(taskToCreate.amount);
  });

  it('should update a task', async () => {
    const taskToCreate = {
      taskType: 'income',
      title: 'Задача для Обновления',
      dueDate: '2025-06-15',
      time: new Date().toISOString(),
      hoursWorked: 3,
      amount: 300, // Изменено
      comments: 'Комментарии к тестовой задаче (доход)',
    };
    const createRes = await request(app).post('/tasks').set('Authorization', `Bearer ${token}`).send({ ...taskToCreate, childId: childUuidForTasks });
    expect(createRes.statusCode).toEqual(201);
    const taskId = createRes.body.uuid;

    const updatedTaskData = {
      title: 'Обновленная Задача API',
      comments: 'Обновленные комментарии к задаче',
      dueDate: '2025-06-20',
      amount: 350, // Изменено
    };

    const res = await request(app)
      .put(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedTaskData);
    expect(res.statusCode).toEqual(200);
    expect(typeof res.body).toBe('number');
    expect(res.body).toEqual(1); // Ожидаем, что 1 запись была обновлена

    const getRes = await request(app).get(`/tasks/${taskId}`).set('Authorization', `Bearer ${token}`);
    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body.title).toEqual(updatedTaskData.title);
    expect(getRes.body.amountEarned).toEqual(updatedTaskData.amount); // Проверяем amountEarned
    expect(getRes.body.comments).toEqual(updatedTaskData.comments);
  });

  it('should delete a task', async () => {
    const taskToCreate = {
      taskType: 'income',
      title: 'Задача для Удаления',
      dueDate: '2025-06-15',
      time: new Date().toISOString(),
      hoursWorked: 3,
      amount: 300, // Изменено
      comments: 'Комментарии к тестовой задаче (доход)',
    };
    const createRes = await request(app).post('/tasks').set('Authorization', `Bearer ${token}`).send({ ...taskToCreate, childId: childUuidForTasks });
    expect(createRes.statusCode).toEqual(201);
    const taskId = createRes.body.uuid;

    const res = await request(app)
      .delete(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(204);

    const checkRes = await request(app)
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(checkRes.statusCode).toEqual(404);
  });

  it('should return 400 if type is missing when creating a task', async () => {
    const invalidTask = {
      // taskType: 'income', // Удалено для проверки ошибки
      title: 'Тестовая Задача (Доход)',
      dueDate: '2025-06-15',
      time: new Date().toISOString(),
      hoursWorked: 3,
      amount: 300, // Изменено
      comments: 'Комментарии к тестовой задаче (доход)',
      // taskType: undefined, // Это было избыточно, если поле просто отсутствует
    };
    const res = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidTask);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'taskType is required');
  });

  it('should return 400 if required fields are missing when creating a task (e.g. title)', async () => {
    const invalidTask = {
      taskType: 'income',
      // title: 'Тестовая Задача (Доход)', // Удалено для проверки ошибки
      dueDate: '2025-06-15',
      time: new Date().toISOString(),
      hoursWorked: 3,
      amount: 300, // Изменено
      comments: 'Комментарии к тестовой задаче (доход)',
      // title: undefined, // Это было избыточно
    };
    const res = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidTask);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'title is required');
  });

  it('should return 404 if task not found when updating', async () => {
    const res = await request(app)
      .put('/tasks/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({
        taskType: 'income',
        title: 'Non Existent Task Update', // Достаточно title для обновления
        amount: 100,
        // Остальные поля не обязательны для обновления, если они не меняются
      });
    expect(res.statusCode).toEqual(404);
  });

  it('should return 404 if task not found when deleting', async () => {
    const res = await request(app)
        .delete('/tasks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(404);
  });
});