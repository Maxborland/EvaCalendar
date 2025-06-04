import request from 'supertest';
const { app } = require('../index.js');

// Устанавливаем NODE_ENV до всех импортов, которые могут от него зависеть
process.env.NODE_ENV = 'test';


describe('Expense Category API', () => {
  const baseCategory = { categoryName: 'Тестовая Категория' };

  it('should create a new expense category', async () => {
    const res = await request(app)
      .post('/expense-categories')
      .send(baseCategory);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('uuid');
    expect(res.body.categoryName).toEqual(baseCategory.categoryName);
  });

  it('should get all expense categories', async () => {
    await request(app).post('/expense-categories').send(baseCategory);
    await request(app).post('/expense-categories').send({ categoryName: 'Другая Категория' });

    const res = await request(app)
      .get('/expense-categories');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.some(cat => cat.categoryName === baseCategory.categoryName)).toBeTruthy();
    expect(res.body.some(cat => cat.categoryName === 'Другая Категория')).toBeTruthy();
  });

  it('should update an expense category', async () => {
    const createRes = await request(app)
      .post('/expense-categories')
      .send({ categoryName: 'Категория для Обновления' });
    const uuidToUpdate = createRes.body.uuid;

    const updatedName = 'Обновленная Категория';
    const res = await request(app)
      .put(`/expense-categories/${uuidToUpdate}`)
      .send({ categoryName: updatedName });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('uuid', uuidToUpdate);
    expect(res.body.categoryName).toEqual(updatedName);

    const getRes = await request(app).get(`/expense-categories/${uuidToUpdate}`);
    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body.categoryName).toEqual(updatedName);
  });

  it('should delete an expense category', async () => {
    const createRes = await request(app)
      .post('/expense-categories')
      .send({ categoryName: 'Категория для Удаления' });
    const uuidToDelete = createRes.body.uuid;

    const res = await request(app)
      .delete(`/expense-categories/${uuidToDelete}`);
    expect(res.statusCode).toEqual(204); // Контроллер возвращает 204 при успешном удалении

    const getRes = await request(app).get(`/expense-categories/${uuidToDelete}`);
    expect(getRes.statusCode).toEqual(404);
  });

  it('should return 400 if categoryName is missing when creating', async () => {
    const res = await request(app)
      .post('/expense-categories')
      .send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should return 400 if categoryName is missing when updating', async () => {
    const createRes = await request(app)
      .post('/expense-categories')
      .send({ categoryName: 'Временная' });
    const uuidToUpdate = createRes.body.uuid;

    const res = await request(app)
      .put(`/expense-categories/${uuidToUpdate}`)
      .send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should return 404 if category not found when updating', async () => {
    const res = await request(app)
      .put(`/expense-categories/00000000-0000-0000-0000-000000000000`)
      .send({ categoryName: 'Несуществующая' });
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('message');
  });

  it('should return 404 if category not found when deleting', async () => {
    const res = await request(app)
      .delete(`/expense-categories/00000000-0000-0000-0000-000000000000`);
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('message');
  });
});