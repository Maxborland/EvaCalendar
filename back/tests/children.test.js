import request from 'supertest';
const { app } = require('../index.js');

process.env.NODE_ENV = 'test';


describe('Children API', () => {
  const baseChild = {
    childName: 'Тестовый Ребенок',
    parentName: 'Тестовый Родитель',
    parentPhone: '1234567890',
    address: 'Тестовый Адрес',
    hourlyRate: 100.00,
    comment: 'Тестовый Комментарий',
  };

  it('should create a new child', async () => {
    const res = await request(app)
      .post('/children')
      .send(baseChild);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('uuid');
    expect(res.body.childName).toEqual(baseChild.childName);
  });

  it('should get all children', async () => {
    // Создаем минимум 2 записи для проверки "get all"
    await request(app).post('/children').send(baseChild);
    await request(app).post('/children').send({ ...baseChild, childName: 'Второй Ребенок' });

    const res = await request(app)
      .get('/children');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.some(child => child.childName === baseChild.childName)).toBeTruthy();
    expect(res.body.some(child => child.childName === 'Второй Ребенок')).toBeTruthy();
  });

  it('should get a child by ID', async () => {
    const createRes = await request(app).post('/children').send(baseChild);
    const uuidToRetrieve = createRes.body.uuid;

    const res = await request(app)
      .get(`/children/${uuidToRetrieve}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('uuid', uuidToRetrieve);
    expect(res.body.childName).toEqual(baseChild.childName);
  });

  it('should update a child', async () => {
    const createRes = await request(app).post('/children').send(baseChild);
    const uuidToUpdate = createRes.body.uuid;
    const updatedChildData = {
      childName: 'Иван Измененный',
      parentName: 'Сидоров',
      parentPhone: '0987654321',
      address: 'ул. Ленина',
      hourlyRate: 160.00,
      comment: 'Спокойный ребенок',
    };

    const res = await request(app)
      .put(`/children/${uuidToUpdate}`)
      .send(updatedChildData);
    expect(res.statusCode).toEqual(200);
    // Сервис возвращает обновленный объект, а не сообщение
    expect(res.body).toHaveProperty('uuid', uuidToUpdate);
    expect(res.body.childName).toEqual(updatedChildData.childName);

    const getRes = await request(app).get(`/children/${uuidToUpdate}`);
    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body.childName).toEqual(updatedChildData.childName);
    expect(getRes.body.parentName).toEqual(updatedChildData.parentName);
  });

  it('should delete a child', async () => {
    const createRes = await request(app).post('/children').send(baseChild);
    const uuidToDelete = createRes.body.uuid;

    const res = await request(app)
      .delete(`/children/${uuidToDelete}`);
    expect(res.statusCode).toEqual(204);
    // Сервис возвращает количество удаленных записей или true/false, а не сообщение
    // Для простоты проверим только статус код. Код 204 означает успех без содержимого.

    const getRes = await request(app).get(`/children/${uuidToDelete}`);
    expect(getRes.statusCode).toEqual(404);
    // Сообщение об ошибке может отличаться, проверим что тело ответа содержит message
    expect(getRes.body).toHaveProperty('message');
  });

  // Тесты на валидацию
  it('should return 400 if childName is missing when creating', async () => {
    const invalidChild = { ...baseChild, childName: undefined };
    const res = await request(app)
      .post('/children')
      .send(invalidChild);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/childName is required/);
  });

  it('should return 400 if parentName is missing when creating', async () => {
    const invalidChild = { ...baseChild, parentName: undefined };
    const res = await request(app)
      .post('/children')
      .send(invalidChild);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/parentName is required/);
  });

  it('should return 400 if childName is missing when updating', async () => {
    const createRes = await request(app).post('/children').send(baseChild);
    const uuidToUpdate = createRes.body.uuid;
    const invalidUpdate = { childName: undefined, parentName: 'ValidParentName', parentPhone: '123', address: '123', hourlyRate: 100 }; // Добавил обязательные поля

    const res = await request(app)
      .put(`/children/${uuidToUpdate}`)
      .send(invalidUpdate);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/childName is required/);
  });

  it('should return 400 if parentName is missing when updating', async () => {
    const createRes = await request(app).post('/children').send(baseChild);
    const uuidToUpdate = createRes.body.uuid;
    const invalidUpdate = { childName: 'ValidChildName', parentName: undefined, parentPhone: '123', address: '123', hourlyRate: 100 }; // Добавил обязательные поля

    const res = await request(app)
      .put(`/children/${uuidToUpdate}`)
      .send(invalidUpdate);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/parentName is required/);
  });

  it('should return 404 if child not found when updating', async () => {
    const res = await request(app)
      .put(`/children/00000000-0000-0000-0000-000000000000`) // Используем валидный формат UUID, который вряд ли существует
      .send({ childName: 'Несуществующий', parentName: 'Несуществующий', parentPhone: '123', address: '123', hourlyRate: 100 }); // Добавил обязательные поля
    expect(res.statusCode).toEqual(404);
    // Сообщение об ошибке может отличаться, проверим что тело ответа содержит message
    expect(res.body).toHaveProperty('message');
  });

  it('should return 404 if child not found when deleting', async () => {
    const res = await request(app)
      .delete(`/children/00000000-0000-0000-0000-000000000000`); // Используем валидный формат UUID, который вряд ли существует
    expect(res.statusCode).toEqual(404);
    // Сообщение об ошибке может отличаться, проверим что тело ответа содержит message
    expect(res.body).toHaveProperty('message');
  });
});