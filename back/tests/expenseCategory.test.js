import request from 'supertest';
import db from '../db.cjs'; // Используем db.cjs
import { app } from '../index.js';

// Устанавливаем NODE_ENV до всех импортов, которые могут от него зависеть
process.env.NODE_ENV = 'test';

beforeEach(async () => {
  // Очищаем таблицу перед каждым тестом, чтобы тесты были независимыми
  await db('expense_categories').del();
});

describe('Expense Category API', () => {
  let categoryId;

  it('should create a new expense category', async () => {
    const res = await request(app)
      .post('/expense-categories')
      .send({ category_name: 'Food' });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.category_name).toEqual('Food');
    categoryId = res.body.id;
  });

  it('should get all expense categories', async () => {
    // Создадим несколько категорий для теста
    await request(app).post('/expense-categories').send({ category_name: 'Transport' });
    await request(app).post('/expense-categories').send({ category_name: 'Utilities' });

    const res = await request(app)
      .get('/expense-categories');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThanOrEqual(2); // Может быть больше из-за предыдущих тестов
    expect(res.body.some(cat => cat.category_name === 'Transport')).toBeTruthy();
    expect(res.body.some(cat => cat.category_name === 'Utilities')).toBeTruthy();
  });

  it('should update an expense category', async () => {
    // Сначала создадим категорию для обновления
    const createRes = await request(app)
      .post('/expense-categories')
      .send({ category_name: 'Old Name' });
    const idToUpdate = createRes.body.id;

    console.log(`Updating category with id: ${idToUpdate}`);
    const res = await request(app)
      .put(`/expense-categories/${idToUpdate}`)
      .send({ category_name: 'New Name' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Category updated successfully');

    // Проверим, что категория действительно обновилась
    const getRes = await request(app).get('/expense-categories');
    const updatedCategory = getRes.body.find(cat => cat.id === idToUpdate);
    expect(updatedCategory.category_name).toEqual('New Name');
  });

  it('should delete an expense category', async () => {
    // Сначала создадим категорию для удаления
    const createRes = await request(app)
      .post('/expense-categories')
      .send({ category_name: 'Category to Delete' });
    const idToDelete = createRes.body.id;

    console.log(`Deleting category with id: ${idToDelete}`);
    const res = await request(app)
      .delete(`/expense-categories/${idToDelete}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Category deleted successfully');

    // Проверим, что категория действительно удалена
    const getRes = await request(app).get('/expense-categories');
    expect(getRes.body.find(cat => cat.id === idToDelete)).toBeUndefined();
  });

  // Тесты на валидацию
  it('should return 400 if category_name is missing when creating', async () => {
    const res = await request(app)
      .post('/expense-categories')
      .send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Category name is required');
  });

  it('should return 400 if category_name is missing when updating', async () => {
    // Создадим категорию для обновления
    const createRes = await request(app)
      .post('/expense-categories')
      .send({ category_name: 'Temp' });
    const idToUpdate = createRes.body.id;

    const res = await request(app)
      .put(`/expense-categories/${idToUpdate}`)
      .send({});
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Category name is required');
  });

  it('should return 404 if category not found when updating', async () => {
    const res = await request(app)
      .put(`/expense-categories/999999`) // Используем несуществующий ID
      .send({ category_name: 'Non Existent' });
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toEqual('Category not found');
  });

  it('should return 404 if category not found when deleting', async () => {
    const res = await request(app)
      .delete(`/expense-categories/999999`); // Используем несуществующий ID
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toEqual('Category not found');
  });
});