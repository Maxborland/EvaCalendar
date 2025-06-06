const request = require('supertest');
const db = require('../db.cjs');
const { app } = require('../index.js');

// process.env.NODE_ENV = 'test'; // Устанавливается в jest.setup.js

describe('Note API', () => {
  let token;
  const uniqueUser = {
    username: `testuser_notes_${Date.now()}`,
    email: `test_notes_${Date.now()}@example.com`,
    password: 'password123',
  };
  // let createdNoteUuid; // Больше не используется глобально для describe

  beforeEach(async () => { // Изменено с beforeAll на beforeEach
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
  });

  const baseNote = {
    date: '2025-05-30',
    content: 'Тестовая заметка от авторизованного пользователя',
  };

  it('should create a new note', async () => {
    const res = await request(app)
      .post('/notes')
      .set('Authorization', `Bearer ${token}`)
      .send(baseNote);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('uuid');
    expect(res.body.date).toEqual(baseNote.date);
    expect(res.body.content).toEqual(baseNote.content);
    // createdNoteUuid = res.body.uuid; // Удалено
  });

  it('should get all notes for the authenticated user', async () => {
    // Создаем первую заметку
    const note1Data = { ...baseNote, content: 'Первая заметка для GET ALL', date: '2025-06-01' };
    const createRes1 = await request(app)
        .post('/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(note1Data);
    expect(createRes1.statusCode).toEqual(201);

    // Создаем вторую заметку
    const note2Data = { ...baseNote, content: 'Вторая заметка для GET ALL', date: '2025-06-02' };
    const createRes2 = await request(app)
        .post('/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(note2Data);
    expect(createRes2.statusCode).toEqual(201);

    const res = await request(app)
        .get('/notes')
        .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.some(note => note.content === note1Data.content)).toBeTruthy();
    expect(res.body.some(note => note.content === note2Data.content)).toBeTruthy();
  });

  it('should get a note by UUID', async () => {
    const noteData = { ...baseNote, content: 'Заметка для GET по UUID' };
    const createRes = await request(app)
        .post('/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(noteData);
    expect(createRes.statusCode).toEqual(201);
    const uuidToRetrieve = createRes.body.uuid;

    const res = await request(app)
        .get(`/notes/${uuidToRetrieve}`)
        .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('uuid', uuidToRetrieve);
    expect(res.body.content).toEqual(noteData.content);
  });

  it('should update a note', async () => {
    const noteData = { ...baseNote, content: 'Начальная заметка для обновления' };
    const createRes = await request(app)
        .post('/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(noteData);
    expect(createRes.statusCode).toEqual(201);
    const uuidToUpdate = createRes.body.uuid;
    const originalDate = createRes.body.date;

    const updatedContent = 'Обновленное содержание заметки';
    const res = await request(app)
      .put(`/notes/${uuidToUpdate}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: updatedContent }); // Отправляем только обновляемый контент
    expect(res.statusCode).toEqual(200);
    expect(res.body.content).toEqual(updatedContent);
    expect(res.body.date).toEqual(originalDate); // Дата не должна меняться, если не передана
  });

  it('should delete a note', async () => {
    const noteToDelete = { ...baseNote, content: 'Заметка для удаления' };
    const createRes = await request(app)
      .post('/notes')
      .set('Authorization', `Bearer ${token}`)
      .send(noteToDelete);
    expect(createRes.statusCode).toEqual(201);
    const uuidToDelete = createRes.body.uuid;

    const res = await request(app)
        .delete(`/notes/${uuidToDelete}`)
        .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(204);

    const checkRes = await request(app)
        .get(`/notes/${uuidToDelete}`)
        .set('Authorization', `Bearer ${token}`);
    expect(checkRes.statusCode).toEqual(404);
  });

  it('should return 400 if date is missing when creating a note', async () => {
    const res = await request(app)
      .post('/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Заметка без даты' });
    expect(res.statusCode).toEqual(400);
  });

  it('should return 404 if note not found when updating', async () => {
    const res = await request(app)
      .put('/notes/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Попытка обновить несуществующую' });
    expect(res.statusCode).toEqual(404);
  });

  it('should return 404 if note not found when deleting', async () => {
    const res = await request(app)
        .delete('/notes/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(404);
  });

  describe('GET /notes/date/:dateString', () => {
    const testDate = '2025-07-15';
    // baseNoteForDate будет использоваться для создания уникальной заметки в beforeEach
    const baseNoteForDate = {
      content: 'Заметка для конкретной даты от авторизованного пользователя',
    };
    // let noteForDateUuid; // Не используется в этой версии

    // beforeEach для describe('/notes/date/:dateString') остается,
    // но теперь он будет работать в контексте beforeEach верхнего уровня,
    // который уже создал пользователя и токен.
    beforeEach(async () => {
      // Убедимся, что для testDate нет других заметок от этого пользователя,
      // или создадим/обновим заметку так, чтобы она была единственной для этой даты.
      // Для простоты, можно сначала попытаться удалить, если существует, потом создать.
      // Однако, учитывая, что beforeEach верхнего уровня создает нового пользователя
      // и afterEach очищает БД, эта специфичная beforeEach может быть избыточной
      // или должна создавать заметку для каждого теста в этом вложенном describe.

      // Для теста 'should get a note by date' нужно, чтобы заметка существовала.
      // Для теста 'should return 404' нужно, чтобы заметка НЕ существовала.
      // Поэтому beforeEach здесь не очень подходит в его текущем виде.
      // Перенесем создание в сам тест 'should get a note by date'.
    });

    it('should get a note by date if it exists for the authenticated user', async () => {
      const notePayload = { ...baseNoteForDate, date: testDate };
      const createRes = await request(app)
        .post('/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(notePayload);
      expect(createRes.statusCode).toEqual(201);

      const res = await request(app)
        .get(`/notes/date/${testDate}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('uuid', createRes.body.uuid); // Проверяем uuid созданной заметки
      expect(res.body.date).toEqual(testDate);
      expect(res.body.content).toEqual(baseNoteForDate.content);
    });

    it('should return 404 if note for the date does not exist for the user', async () => {
      const nonExistentDate = '2025-07-16';
      const res = await request(app)
        .get(`/notes/date/${nonExistentDate}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(404);
    });
  });
});