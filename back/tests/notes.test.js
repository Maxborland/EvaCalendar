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

    const updatedContent = 'Обновленное содержание заметки';
    const updatedDate = '2025-06-01';
    const res = await request(app)
      .put(`/notes/${uuidToUpdate}`)
      .send({ content: updatedContent, date: updatedDate });
    expect(res.statusCode).toEqual(200);
    expect(res.body.content).toEqual(updatedContent);
    expect(res.body.date).toEqual(updatedDate);
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
      .send({ content: 'Попытка обновить несуществующую', date: '2025-01-01' });
    expect(res.statusCode).toEqual(404);
  });

  it('should return 404 if note not found when deleting', async () => {
    const res = await request(app).delete('/notes/00000000-0000-0000-0000-000000000000');
    expect(res.statusCode).toEqual(404);
  });
});