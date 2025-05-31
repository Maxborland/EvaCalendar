const request = require('supertest');
const db = require('../db.cjs');
const { app } = require('../index.js');

process.env.NODE_ENV = 'test';

describe('Note API', () => {
  const baseNote = {
    date: '2025-05-30',
    content: 'Тестовая заметка',
  };

  it('should create a new note', async () => {
    const res = await request(app)
      .post('/notes')
      .send(baseNote);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('uuid');
    expect(res.body.date).toEqual(baseNote.date);
    expect(res.body.content).toEqual(baseNote.content);
  });

  it('should get all notes', async () => {
    await request(app).post('/notes').send(baseNote);
    await request(app).post('/notes').send({ ...baseNote, content: 'Другая заметка', date: '2025-05-31' });

    const res = await request(app).get('/notes');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.some(note => note.content === baseNote.content)).toBeTruthy();
    expect(res.body.some(note => note.content === 'Другая заметка')).toBeTruthy();
  });

  it('should get a note by UUID', async () => {
    const createRes = await request(app)
      .post('/notes')
      .send({ ...baseNote, content: 'Специфическая заметка' });
    const uuidToRetrieve = createRes.body.uuid;

    const res = await request(app).get(`/notes/${uuidToRetrieve}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('uuid', uuidToRetrieve);
    expect(res.body.content).toEqual('Специфическая заметка');
  });

  it('should update a note', async () => {
    const createRes = await request(app)
      .post('/notes')
      .send({ ...baseNote, content: 'Заметка для обновления' });
    const uuidToUpdate = createRes.body.uuid;
    const originalDate = createRes.body.date; // Сохраняем исходную дату

    const updatedContent = 'Обновленное содержание заметки';
    // const updatedDate = '2025-06-01'; // Это поле больше не должно влиять на обновление даты

    const res = await request(app)
      .put(`/notes/${uuidToUpdate}`)
      .send({ content: updatedContent }); // Отправляем только content, как и делает фронтенд
      // Если бы мы отправили date, сервис бы его проигнорировал, но тест должен отражать реальное использование

    expect(res.statusCode).toEqual(200);
    expect(res.body.content).toEqual(updatedContent);
    expect(res.body.date).toEqual(originalDate); // Проверяем, что дата не изменилась
  });

  it('should delete a note', async () => {
    const createRes = await request(app)
      .post('/notes')
      .send({ ...baseNote, content: 'Заметка для удаления' });
    const uuidToDelete = createRes.body.uuid;

    const res = await request(app).delete(`/notes/${uuidToDelete}`);
    expect(res.statusCode).toEqual(204);

    const checkRes = await request(app).get(`/notes/${uuidToDelete}`);
    expect(checkRes.statusCode).toEqual(404);
  });

  it('should return 400 if date is missing when creating a note', async () => {
    const res = await request(app)
      .post('/notes')
      .send({ content: 'Заметка без даты' });
    expect(res.statusCode).toEqual(400);
  });

  it('should return 404 if note not found when updating', async () => {
    const res = await request(app)
      .put('/notes/00000000-0000-0000-0000-000000000000')
      .send({ content: 'Попытка обновить несуществующую' }); // Отправляем только content
    expect(res.statusCode).toEqual(404);
  });

  it('should return 404 if note not found when deleting', async () => {
    const res = await request(app).delete('/notes/00000000-0000-0000-0000-000000000000');
    expect(res.statusCode).toEqual(404);
  });
describe('GET /notes/date/:dateString', () => {
    const testDate = '2025-07-15';
    const noteForDate = {
      date: testDate,
      content: 'Заметка для конкретной даты',
    };

    beforeEach(async () => {
      // Убедимся, что в базе нет заметки для этой даты перед тестом на "не найдено"
      // и создаем заметку для теста на "найдено"
      await db('notes').where({ date: testDate }).del(); // Сначала удаляем, если есть
      await request(app).post('/notes').send(noteForDate); // Затем создаем
    });

    it('should get a note by date if it exists', async () => {
      const res = await request(app).get(`/notes/date/${testDate}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('uuid');
      expect(res.body.date).toEqual(noteForDate.date);
      expect(res.body.content).toEqual(noteForDate.content);
    });

    it('should return 404 if note for the date does not exist', async () => {
      const nonExistentDate = '2025-07-16';
      const res = await request(app).get(`/notes/date/${nonExistentDate}`);
      expect(res.statusCode).toEqual(404);
    });

  });
});