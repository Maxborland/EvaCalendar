const express = require('express');
const childrenService = require('../services/childrenService.js');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const child = await childrenService.createChild(req.body);
    res.status(201).json(child);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const children = await childrenService.getAllChildren();
    res.status(200).json(children);
  } catch (error) {
    next(error);
  }
});

router.get('/:uuid', async (req, res, next) => {
  try {
    const child = await childrenService.getChildById(req.params.uuid);
    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }
    res.status(200).json(child);
  } catch (error) {
    next(error);
  }
});

router.put('/:uuid', async (req, res, next) => {
  try {
    const updatedChild = await childrenService.updateChild(req.params.uuid, req.body);
    if (!updatedChild) {
      return res.status(404).json({ message: 'Child not found' });
    }
    res.status(200).json(updatedChild);
  } catch (error) {
    next(error);
  }
});

router.delete('/:uuid', async (req, res, next) => {
  try {
    const deletedCount = await childrenService.deleteChild(req.params.uuid);
    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Child not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
