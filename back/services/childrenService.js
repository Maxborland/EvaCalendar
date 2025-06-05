const { v4: uuidv4 } = require('uuid');
const knex = require('../db.cjs');
const ApiError = require('../utils/ApiError.js');

class ChildrenService {
  async createChild(childData, userId) {
    const requiredFields = ['childName', 'parentName', 'parentPhone', 'address', 'hourlyRate'];
    for (const field of requiredFields) {
      if (!childData[field]) {
        throw ApiError.badRequest(`${field} is required`);
      }
    }
    const newUuid = uuidv4();
    const [createdChild] = await knex('children').insert({ uuid: newUuid, user_uuid: userId, ...childData }).returning('*');
    return createdChild;
  }

  async getAllChildren(userId) {
    return knex('children').where({ user_uuid: userId }).select('*');
  }

  async getChildById(uuid, userId) {
    return knex('children').where({ uuid, user_uuid: userId }).first();
  }

  async updateChild(uuid, childData, userId) {
    const existingChild = await knex('children').where({ uuid, user_uuid: userId }).first();
    if (!existingChild) {
        return null;
    }

    const requiredFields = ['childName', 'parentName', 'parentPhone', 'address', 'hourlyRate'];
    for (const field of requiredFields) {
      if (childData.hasOwnProperty(field) && !childData[field]) {
        throw ApiError.badRequest(`${field} is required`);
      }
    }
    const [updatedChild] = await knex('children').where({ uuid, user_uuid: userId }).update(childData).returning('*');
    return updatedChild;
  }

  async deleteChild(uuid, userId) {
    return knex('children').where({ uuid, user_uuid: userId }).del();
  }
}

module.exports = new ChildrenService();