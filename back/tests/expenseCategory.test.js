import request from 'supertest';
const { app } = require('../index.js');

// process.env.NODE_ENV = 'test'; // Устанавливается в jest.setup.js

describe('Expense Category API', () => {
  let token;
  let createdCategoryUuid;

  beforeEach(async () => {
    const timestamp = Date.now();
    const uniqueUser = {
      username: `testuser_exp_cat_${timestamp}`,
      email: `test_exp_cat_${timestamp}@example.com`,
      password: 'password123',
    };
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(uniqueUser);
    expect(registerRes.statusCode).toEqual(201);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: uniqueUser.email,
        password: uniqueUser.password,
      });
    expect(loginRes.statusCode).toEqual(200);
    expect(loginRes.body).toHaveProperty('token');
    token = loginRes.body.token;
  });

  const baseCategory = { categoryName: 'Тестовая Категория Расходов' };

  it('should create a new expense category', async () => {
    const res = await request(app)
      .post('/api/expense-categories')
      .set('Authorization', `Bearer ${token}`)
      .send(baseCategory);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('uuid');
    expect(res.body.categoryName).toEqual(baseCategory.categoryName);
    createdCategoryUuid = res.body.uuid;
  });

  it('should get all expense categories for the authenticated user', async () => {
    const catData1 = { ...baseCategory, categoryName: 'Категория для GET ALL 1' };
    const createRes1 = await request(app)
      .post('/api/expense-categories')
      .set('Authorization', `Bearer ${token}`)
      .send(catData1);
    expect(createRes1.statusCode).toEqual(201);

    const catData2 = { ...baseCategory, categoryName: 'Категория для GET ALL 2' };
    const createRes2 = await request(app)
      .post('/api/expense-categories')
      .set('Authorization', `Bearer ${token}`)
      .send(catData2);
    expect(createRes2.statusCode).toEqual(201);

    const res = await request(app)
      .get('/api/expense-categories')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.some(cat => cat.categoryName === catData1.categoryName)).toBeTruthy();
    expect(res.body.some(cat => cat.categoryName === catData2.categoryName)).toBeTruthy();
  });

  it('should get an expense category by uuid', async () => {
    const categoryForGet = { categoryName: 'Категория для GET по UUID' };
    const createResponse = await request(app)
      .post('/api/expense-categories')
      .set('Authorization', `Bearer ${token}`)
      .send(categoryForGet);
    expect(createResponse.statusCode).toEqual(201);
    const uuidToGet = createResponse.body.uuid;

    const res = await request(app)
      .get(`/api/expense-categories/${uuidToGet}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('uuid', uuidToGet);
    expect(res.body.categoryName).toEqual(categoryForGet.categoryName);
  });

  it('should update an expense category', async () => {
    const catToUpdate = { categoryName: 'Категория для Обновления Начальная' };
    const createRes = await request(app)
        .post('/api/expense-categories')
        .set('Authorization', `Bearer ${token}`)
        .send(catToUpdate);
    expect(createRes.statusCode).toEqual(201);
    const uuidToUpdate = createRes.body.uuid;

    const updatedName = 'Обновленная Категория Расходов';
    const res = await request(app)
      .put(`/api/expense-categories/${uuidToUpdate}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryName: updatedName });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('uuid', uuidToUpdate);
    expect(res.body.categoryName).toEqual(updatedName);

    const getRes = await request(app)
        .get(`/api/expense-categories/${uuidToUpdate}`)
        .set('Authorization', `Bearer ${token}`);
    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body.categoryName).toEqual(updatedName);
  });

  it('should delete an expense category', async () => {
    const categoryToDelete = { categoryName: 'Категория для Удаления' };
    const createRes = await request(app)
      .post('/api/expense-categories')
      .set('Authorization', `Bearer ${token}`)
      .send(categoryToDelete);
    expect(createRes.statusCode).toEqual(201);
    const uuidToDelete = createRes.body.uuid;

    const res = await request(app)
      .delete(`/api/expense-categories/${uuidToDelete}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(204);

    const getRes = await request(app)
        .get(`/api/expense-categories/${uuidToDelete}`)
        .set('Authorization', `Bearer ${token}`);
    expect(getRes.statusCode).toEqual(404);
  });

  it('should return 400 if categoryName is missing when creating', async () => {
    const res = await request(app)
      .post('/api/expense-categories')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should return 400 if categoryName is missing when updating', async () => {
    const tempCategory = { categoryName: 'Временная для Ошибки Обновления' };
    const createRes = await request(app)
      .post('/api/expense-categories')
      .set('Authorization', `Bearer ${token}`)
      .send(tempCategory);
    expect(createRes.statusCode).toEqual(201);
    const uuidToUpdate = createRes.body.uuid;

    const res = await request(app)
      .put(`/api/expense-categories/${uuidToUpdate}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should return 404 if category not found when updating', async () => {
    const res = await request(app)
      .put(`/api/expense-categories/00000000-0000-0000-0000-000000000000`)
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryName: 'Несуществующая' });
    expect(res.statusCode).toEqual(404);
  });

  it('should return 404 if category not found when deleting', async () => {
    const res = await request(app)
      .delete(`/api/expense-categories/00000000-0000-0000-0000-000000000000`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(404);
  });
});