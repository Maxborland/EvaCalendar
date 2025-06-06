import request from 'supertest';
const { app } = require('../index.js');

// process.env.NODE_ENV = 'test'; // Это уже устанавливается в jest.setup.js

describe('Children API', () => {
  let token; // Для хранения JWT токена
  const uniqueUser = { // Используем действительно уникальные данные
    username: `testuser_children_${Date.now()}`,
    email: `test_children_${Date.now()}@example.com`,
    password: 'password123',
  };

  const baseChild = {
    childName: 'Тестовый Ребенок',
    parentName: 'Тестовый Родитель',
    parentPhone: '1234567890',
    address: 'Тестовый Адрес',
    hourlyRate: 100.00,
    comment: 'Тестовый Комментарий',
  };
  let createdChildUuid; // Для хранения UUID созданного ребенка

  beforeEach(async () => {
    // 1. Регистрация уникального пользователя.
    // Так как jest.setup.js (afterEach) очищает БД после каждого теста,
    // эта регистрация должна всегда проходить успешно для уникального пользователя.
    const registerRes = await request(app)
      .post('/auth/register') // Убран префикс /api
      .send(uniqueUser);
    expect(registerRes.statusCode).toEqual(201); // Ожидаем успешную регистрацию

    // 2. Логин этого пользователя для получения токена.
    const loginRes = await request(app)
      .post('/auth/login') // Убран префикс /api
      .send({
        identifier: uniqueUser.email,
        password: uniqueUser.password,
      });
    expect(loginRes.statusCode).toEqual(200);     // Ожидаем успешный логин
    expect(loginRes.body).toHaveProperty('token'); // Ожидаем наличие токена
    token = loginRes.body.token;
  });

  it('should create a new child', async () => {
    const res = await request(app)
      .post('/children')
      .set('Authorization', `Bearer ${token}`) // Добавляем токен
      .send(baseChild);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('uuid');
    expect(res.body.childName).toEqual(baseChild.childName);
    // createdChildUuid больше не используется глобально для describe
  });

  it('should get all children for the authenticated user', async () => {
    // Создаем первого ребенка
    const childData1 = { ...baseChild, childName: 'Ребенок для GET ALL 1' };
    const createRes1 = await request(app)
      .post('/children')
      .set('Authorization', `Bearer ${token}`)
      .send(childData1);
    expect(createRes1.statusCode).toEqual(201);

    // Создаем второго ребенка
    const childData2 = { ...baseChild, childName: 'Ребенок для GET ALL 2' };
    const createRes2 = await request(app)
        .post('/children')
        .set('Authorization', `Bearer ${token}`)
        .send(childData2);
    expect(createRes2.statusCode).toEqual(201);

    const res = await request(app)
      .get('/children')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.some(child => child.childName === childData1.childName)).toBeTruthy();
    expect(res.body.some(child => child.childName === childData2.childName)).toBeTruthy();
  });

  it('should get a child by ID', async () => {
    // Создаем ребенка для этого теста
    const childDataForGet = { ...baseChild, childName: 'Ребенок для GET по ID' };
    const createRes = await request(app)
      .post('/children')
      .set('Authorization', `Bearer ${token}`)
      .send(childDataForGet);
    expect(createRes.statusCode).toEqual(201);
    const childUuid = createRes.body.uuid;

    const res = await request(app)
      .get(`/children/${childUuid}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('uuid', childUuid);
    expect(res.body.childName).toEqual(childDataForGet.childName);
  });

  it('should update a child', async () => {
    // Создаем ребенка для этого теста
    const childDataForUpdate = { ...baseChild, childName: 'Ребенок для Обновления' };
    const createRes = await request(app)
      .post('/children')
      .set('Authorization', `Bearer ${token}`)
      .send(childDataForUpdate);
    expect(createRes.statusCode).toEqual(201);
    const uuidToUpdate = createRes.body.uuid;
    const updatedChildData = {
      childName: 'Иван Измененный',
      parentName: 'Сидоров Обновленный',
      parentPhone: '0987654321',
      address: 'ул. Ленина, д.1, кв.2',
      hourlyRate: 160.00,
      comment: 'Спокойный и обновленный ребенок',
    };

    const res = await request(app)
      .put(`/children/${uuidToUpdate}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedChildData);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('uuid', uuidToUpdate);
    expect(res.body.childName).toEqual(updatedChildData.childName);
    expect(res.body.parentName).toEqual(updatedChildData.parentName);

    const getRes = await request(app)
        .get(`/children/${uuidToUpdate}`)
        .set('Authorization', `Bearer ${token}`);
    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body.childName).toEqual(updatedChildData.childName);
    expect(getRes.body.parentName).toEqual(updatedChildData.parentName);
  });

  it('should delete a child', async () => {
    const childToDeleteData = { ...baseChild, childName: 'Ребенок для Удаления' };
    const createRes = await request(app)
        .post('/children')
        .set('Authorization', `Bearer ${token}`)
        .send(childToDeleteData);
    expect(createRes.statusCode).toEqual(201);
    const uuidToDelete = createRes.body.uuid;

    const res = await request(app)
      .delete(`/children/${uuidToDelete}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(204);

    const getRes = await request(app)
        .get(`/children/${uuidToDelete}`)
        .set('Authorization', `Bearer ${token}`);
    expect(getRes.statusCode).toEqual(404);
  });

  it('should return 400 if childName is missing when creating', async () => {
    const invalidChild = { ...baseChild, childName: undefined };
    const res = await request(app)
      .post('/children')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidChild);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/childName is required/i);
  });

  it('should return 400 if parentName is missing when creating', async () => {
    const invalidChild = { ...baseChild, parentName: undefined };
    const res = await request(app)
      .post('/children')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidChild);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/parentName is required/i);
  });

  it('should return 400 if childName is missing when updating', async () => {
    const childToUpdateData = { ...baseChild, childName: 'Ребенок для Обновления с Ошибкой Имени' };
    const createRes = await request(app)
        .post('/children')
        .set('Authorization', `Bearer ${token}`)
        .send(childToUpdateData);
    expect(createRes.statusCode).toEqual(201);
    const uuidToUpdate = createRes.body.uuid;

    const invalidUpdate = { childName: '', parentName: 'ValidParentName', parentPhone: '123', address: '123', hourlyRate: 100 }; // Изменено undefined на ''
    const res = await request(app)
      .put(`/children/${uuidToUpdate}`)
      .set('Authorization', `Bearer ${token}`)
      .send(invalidUpdate);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/childName is required/i);
  });

  it('should return 400 if parentName is missing when updating', async () => {
    const childToUpdateData = { ...baseChild, childName: 'Ребенок для Обновления с Ошибкой Родителя' };
    const createRes = await request(app)
        .post('/children')
        .set('Authorization', `Bearer ${token}`)
        .send(childToUpdateData);
    expect(createRes.statusCode).toEqual(201);
    const uuidToUpdate = createRes.body.uuid;

    const invalidUpdate = { childName: 'ValidChildName', parentName: '', parentPhone: '123', address: '123', hourlyRate: 100 }; // Изменено undefined на ''
    const res = await request(app)
      .put(`/children/${uuidToUpdate}`)
      .set('Authorization', `Bearer ${token}`)
      .send(invalidUpdate);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/parentName is required/i);
  });

  it('should return 404 if child not found when updating a non-existent uuid', async () => {
    const res = await request(app)
      .put(`/children/00000000-0000-0000-0000-000000000000`)
      .set('Authorization', `Bearer ${token}`)
      .send({ childName: 'Несуществующий', parentName: 'Несуществующий', parentPhone: '123', address: '123', hourlyRate: 100 });
    expect(res.statusCode).toEqual(404);
  });

  it('should return 404 if child not found when deleting a non-existent uuid', async () => {
    const res = await request(app)
      .delete(`/children/00000000-0000-0000-0000-000000000000`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(404);
  });
});