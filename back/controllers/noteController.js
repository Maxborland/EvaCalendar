import asyncHandler from 'express-async-handler';
import { body, param, validationResult } from 'express-validator';
import noteService from '../services/noteService.js';
import ApiError from '../utils/ApiError.js';

class NoteController {
  getNoteByWeekId = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const { weekId } = req.params;
    const note = await noteService.getNoteByWeekId(weekId);
    if (note) {
      res.json(note);
    } else {
      res.json({}); // Возвращаем пустой объект JSON, если заметка не найдена
    }
  });

  createOrUpdateNote = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const { weekId, content } = req.body;
    const note = await noteService.createOrUpdateNote(weekId, content);
    res.status(201).json(note);
  });

  deleteNote = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const { weekId } = req.params;
    await noteService.deleteNote(weekId);
    res.status(204).send();
  });
}

export default new NoteController();

export const validateNote = {
  getNoteByWeekId: [
    param('weekId').isUUID().withMessage('weekId должен быть валидным UUID.'),
  ],
  createOrUpdateNote: [
    body('weekId').isUUID().withMessage('weekId должен быть валидным UUID.'),
    body('content').isString().withMessage('Содержимое заметки должно быть строкой.'),
  ],
  deleteNote: [
    param('weekId').isUUID().withMessage('weekId должен быть валидным UUID.'),
  ],
};