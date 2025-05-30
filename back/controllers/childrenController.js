import asyncHandler from 'express-async-handler';
import Joi from 'joi';
import childService from '../services/childrenService.js';
import ApiError from '../utils/ApiError.js';

const childSchema = Joi.object({
  childName: Joi.string().required(),
  parentName: Joi.string().required(),
  parentPhone: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  hourlyRate: Joi.number().min(0).allow(null),
  comment: Joi.string().allow('', null),
});

const updateChildSchema = Joi.object({
  childName: Joi.string().required(),
  parentName: Joi.string().required(),
  parentPhone: Joi.string().allow('', null).optional(),
  address: Joi.string().allow('', null).optional(),
  hourlyRate: Joi.number().min(0).allow(null).optional(),
  comment: Joi.string().allow('', null).optional(),
}).min(1);

// Middleware для валидации
const validateChild = (req, res, next) => {
  let schema;
  if (req.method === 'PUT') {
    schema = updateChildSchema;
  } else {
    schema = childSchema;
  }

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    throw ApiError.badRequest(error.details[0].message.replace(/"/g, ''));
  }
  next();
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
  getChildById, updateChild, validateChild
};

