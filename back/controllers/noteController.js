const express = require('express');
const router = express.Router();
const noteService = require('../services/noteService');
const ApiError = require('../utils/ApiError');

// POST /notes - Создание новой заметки
router.post('/', async (req, res, next) => {
    try {
        const newNote = await noteService.createNote(req.body);
        res.status(201).json(newNote);
    } catch (error) {
        // Передаем ошибку как есть (уже содержит statusCode)
        next(error);
    }
});

// GET /notes - Получение списка всех заметок
router.get('/', async (req, res, next) => {
    try {
        const notes = await noteService.getAllNotes();
        res.status(200).json(notes);
    } catch (error) {
        next(error);
    }
});

// GET /notes/:uuid - Получение информации о заметке по UUID
router.get('/:uuid', async (req, res, next) => {
    try {
        const note = await noteService.getNoteById(req.params.uuid);
        if (note) {
            res.status(200).json(note);
        } else {
            next(ApiError.notFound('Заметка не найдена'));
        }
    } catch (error) {
        next(error);
    }
});
// GET /notes/date/:dateString - Получение информации о заметке по дате
router.get('/date/:dateString', async (req, res, next) => {
    try {
        // Используем обновленный метод сервиса, который возвращает массив
        const notes = await noteService.getNotesByDate(req.params.dateString);
        // Всегда возвращаем 200 OK и массив заметок (может быть пустым)
        res.status(200).json(notes);
    } catch (error) {
        next(error);
    }
});

// PUT /notes/:uuid - Обновление информации о заметке
router.put('/:uuid', async (req, res, next) => {
    try {
        const updatedNote = await noteService.updateNote(req.params.uuid, req.body);
        if (updatedNote) {
            res.status(200).json(updatedNote);
        } else {
            next(ApiError.notFound('Заметка не найдена для обновления'));
        }
    } catch (error) {
        next(error);
    }
});

// DELETE /notes/:uuid - Удаление заметки
router.delete('/:uuid', async (req, res, next) => {
    try {
        const deleted = await noteService.deleteNote(req.params.uuid);
        if (deleted) {
            res.status(204).send(); // No Content
        } else {
            next(ApiError.notFound('Заметка не найдена для удаления'));
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;