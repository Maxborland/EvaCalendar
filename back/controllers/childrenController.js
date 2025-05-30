import asyncHandler from 'express-async-handler';
import { body, param, validationResult } from 'express-validator';
import childService from '../services/childrenService.js';
import ApiError from '../utils/ApiError.js';

class ChildController {
  getAllChildren = asyncHandler(async (req, res) => {
    const children = await childService.getAllChildren();
    res.json(children);
  });

  getChildById = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const { id } = req.params;
    const child = await childService.getChildById(id);
    if (!child) {
      throw ApiError.notFound('Child not found');
    }
    res.json(child);
  });

  addChild = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const newChild = await childService.addChild(req.body);
    res.status(201).json(newChild);
  });

  updateChild = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const { id } = req.params;
    const updatedChild = await childService.updateChild(id, req.body);
    if (!updatedChild) {
      throw ApiError.notFound('Child not found');
    }
    res.json({ message: 'Child updated successfully' });
  });

  deleteChild = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const { id } = req.params;
    const deleted = await childService.deleteChild(id);
    if (!deleted) {
      throw ApiError.notFound('Child not found');
    }
    res.status(200).json({ message: 'Child deleted successfully' });
  });
}

export default new ChildController();

export const validateChild = {
  getChildById: [
    param('id').isUUID().withMessage('ID ребенка должен быть валидным UUID.'),
  ],
  addChild: [
    body('childName').optional().isString().notEmpty().withMessage('Имя ребенка обязательно.'),
    body('parentName').isString().notEmpty().withMessage('Имя родителя обязательно.'),
    body('parentPhone').optional({ nullable: true }).isString().withMessage('Телефон родителя должен быть строкой.'),
    body('address').optional({ nullable: true }).isString().withMessage('Адрес должен быть строкой.'),
    body('hourlyRate').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Ставка должна быть положительным числом.'),
    body('comment').optional({ nullable: true }).isString().withMessage('Комментарии должны быть строкой.'),
  ],
  updateChild: [
    param('id').isUUID().withMessage('ID ребенка должен быть валидным UUID.'),
    body('childName').optional().isString().withMessage('Имя ребенка должно быть строкой.'),
    body('parentName').optional().isString().notEmpty().withMessage('Имя родителя обязательно.'),
    body('parentPhone').optional({ nullable: true }).isString().withMessage('Телефон родителя должен быть строкой.'),
    body('address').optional({ nullable: true }).isString().withMessage('Адрес должен быть строкой.'),
    body('hourlyRate').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Ставка должна быть положительным числом.'),
    body('comment').optional({ nullable: true }).isString().withMessage('Комментарии должны быть строкой.'),
  ],
  deleteChild: [
    param('id').isUUID().withMessage('ID ребенка должен быть валидным UUID.'),
  ],
};

const getAllChildren = asyncHandler(async (req, res) => {
  const children = await childService.getAllChildren();
  res.json(children);
});

const getChildById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const child = await childService.getChildById(id);
  if (!child) {
    throw ApiError.notFound('Child not found');
  }
  res.json(child);
});

const addChild = asyncHandler(async (req, res) => {
  const newChild = await childService.addChild(req.body);
  res.status(201).json(newChild);
});

const updateChild = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedChild = await childService.updateChild(id, req.body);
  if (!updatedChild) {
    throw ApiError.notFound('Child not found');
  }
  res.json({ message: 'Child updated successfully' });
});

const deleteChild = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await childService.deleteChild(id);
  if (!deleted) {
    throw ApiError.notFound('Child not found');
  }
  res.status(200).json({ message: 'Child deleted successfully' });
});

export {
  addChild, deleteChild, getAllChildren,
  getChildById, updateChild
};

