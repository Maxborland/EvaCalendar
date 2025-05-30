import request from 'supertest';
import db from '../db.cjs';
import { app } from '../index.js';

process.env.NODE_ENV = 'test';

beforeEach(async () => {
  await db('children').del();
});

describe('Children API', () => {
  let childId;
  const newChild = {
    childName: 'Иван',
    parentName: 'Петров',
    parentPhone: '1234567890',
    address: 'ул. Пушкина',
    hourlyRate: 150.00,
    comment: 'Любит машинки',
  };

  it('should create a new child', async () => {
    const res = await request(app)
      .post('/children')
      .send(newChild);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.childName).toEqual(newChild.childName);
    childId = res.body.id;
  });

  it('should get all children', async () => {
    await request(app).post('/children').send(newChild);
    const anotherChild = { ...newChild, childName: 'Мария' };
    await request(app).post('/children').send(anotherChild);

    const res = await request(app)
      .get('/children');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.some(child => child.childName === newChild.childName)).toBeTruthy();
    expect(res.body.some(child => child.childName === anotherChild.childName)).toBeTruthy();
  });

  it('should get a child by ID', async () => {
    const createRes = await request(app).post('/children').send(newChild);
    const idToRetrieve = createRes.body.id;

    const res = await request(app)
      .get(`/children/${idToRetrieve}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('id', idToRetrieve);
    expect(res.body.childName).toEqual(newChild.childName);
  });

  it('should update a child', async () => {
    const createRes = await request(app).post('/children').send(newChild);
    const idToUpdate = createRes.body.id;
    const updatedChildData = {
      childName: 'Иван Измененный',
      parentName: 'Сидоров',
      parentPhone: '0987654321',
      address: 'ул. Ленина',
      hourlyRate: 160.00,
      comment: 'Спокойный ребенок',
    };

    const res = await request(app)
      .put(`/children/${idToUpdate}`)
      .send(updatedChildData);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Child updated successfully');

    const getRes = await request(app).get(`/children/${idToUpdate}`);
    expect(getRes.body.childName).toEqual(updatedChildData.childName);
    expect(getRes.body.parentName).toEqual(updatedChildData.parentName);
  });

  it('should delete a child', async () => {
    const createRes = await request(app).post('/children').send(newChild);
    const idToDelete = createRes.body.id;

    const res = await request(app)
      .delete(`/children/${idToDelete}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Child deleted successfully');

    const getRes = await request(app).get(`/children/${idToDelete}`);
    expect(getRes.statusCode).toEqual(404);
    expect(getRes.body.message).toEqual('Child not found');
  });

  // Тесты на валидацию
  it('should return 400 if childName is missing when creating', async () => {
    const invalidChild = { ...newChild, childName: undefined }; // Удаляем childName
    const res = await request(app)
      .post('/children')
      .send(invalidChild);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/childName is required/);
  });

  it('should return 400 if parentName is missing when creating', async () => {
    const invalidChild = { ...newChild, parentName: undefined }; // Удаляем parentName
    const res = await request(app)
      .post('/children')
      .send(invalidChild);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/parentName is required/);
  });

  it('should return 400 if childName is missing when updating', async () => {
    const createRes = await request(app).post('/children').send(newChild);
    const idToUpdate = createRes.body.id;
    const invalidUpdate = { childName: undefined, parentName: 'ValidParentName' }; // Удаляем childName

    const res = await request(app)
      .put(`/children/${idToUpdate}`)
      .send(invalidUpdate);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/childName is required/);
  });

  it('should return 400 if parentName is missing when updating', async () => {
    const createRes = await request(app).post('/children').send(newChild);
    const idToUpdate = createRes.body.id;
    const invalidUpdate = { childName: 'ValidChildName', parentName: undefined }; // Удаляем parentName

    const res = await request(app)
      .put(`/children/${idToUpdate}`)
      .send(invalidUpdate);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/parentName is required/);
  });

  it('should return 404 if child not found when updating', async () => {
    const res = await request(app)
      .put(`/children/999999`)
      .send({ childName: 'Несуществующий', parentName: 'Несуществующий' });
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toEqual('Child not found');
  });

  it('should return 404 if child not found when deleting', async () => {
    const res = await request(app)
      .delete(`/children/999999`);
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toEqual('Child not found');
  });
});