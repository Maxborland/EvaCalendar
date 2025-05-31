const { v4: uuidv4 } = require('uuid');
const knex = require('../db.cjs');
const ApiError = require('../utils/ApiError.js');

class ChildrenService {
  async createChild(childData) {
    // Проверка обязательных полей
    const requiredFields = ['childName', 'parentName', 'parentPhone', 'address', 'hourlyRate'];
    for (const field of requiredFields) {
      if (!childData[field]) {
        throw ApiError.badRequest(`${field} is required`);
      }
    }
    const newUuid = uuidv4();
    const [createdChild] = await knex('children').insert({ uuid: newUuid, ...childData }).returning('*');
    return createdChild;
  }

  async getAllChildren() {
    return knex('children').select('*');
  }

  async getChildById(uuid) {
    return knex('children').where({ uuid }).first();
  }

  async updateChild(uuid, childData) {
    // Проверка обязательных полей
    const requiredFields = ['childName', 'parentName', 'parentPhone', 'address', 'hourlyRate'];
    for (const field of requiredFields) {
      if (!childData[field]) {
        throw ApiError.badRequest(`${field} is required`);
      }
    }
    const [updatedChild] = await knex('children').where({ uuid }).update(childData).returning('*');
    return updatedChild;
  }

  async deleteChild(uuid) {
    return knex('children').where({ uuid }).del();
  }
}

module.exports = new ChildrenService();