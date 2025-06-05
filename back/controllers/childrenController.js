const express = require('express');
const childrenService = require('../services/childrenService.js');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const child = await childrenService.createChild(req.body, req.user.uuid);
    res.status(201).json(child);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const children = await childrenService.getAllChildren(req.user.uuid);
    res.status(200).json(children);
  } catch (error) {
    next(error);
  }
});

router.get('/:uuid', async (req, res, next) => {
  try {
    const child = await childrenService.getChildById(req.params.uuid, req.user.uuid);
    if (!child) {
      return res.status(404).json({ message: 'Child not found or access denied' });
    }
    res.status(200).json(child);
  } catch (error) {
    next(error);
  }
});

router.put('/:uuid', async (req, res, next) => {
  try {
    const updatedChild = await childrenService.updateChild(req.params.uuid, req.body, req.user.uuid);
    if (!updatedChild) {
      return res.status(404).json({ message: 'Child not found or access denied' });
    }
    res.status(200).json(updatedChild);
  } catch (error) {
    next(error);
  }
});

router.delete('/:uuid', async (req, res, next) => {
  try {
    const deletedCount = await childrenService.deleteChild(req.params.uuid, req.user.uuid);
    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Child not found or access denied' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
