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
    // Добавляем user_uuid при создании
    const [createdChild] = await knex('children').insert({ uuid: newUuid, user_uuid: userId, ...childData }).returning('*');
    return createdChild;
  }

  async getAllChildren(userId) {
    // Фильтруем по user_uuid
    return knex('children').where({ user_uuid: userId }).select('*');
  }

  async getChildById(uuid, userId) {
    // Фильтруем по uuid и user_uuid
    return knex('children').where({ uuid, user_uuid: userId }).first();
  }

  async updateChild(uuid, childData, userId) {
    // Сначала проверяем, существует ли запись и принадлежит ли она пользователю
    const existingChild = await knex('children').where({ uuid, user_uuid: userId }).first();
    if (!existingChild) {
        // Не выбрасываем ошибку, а возвращаем null или undefined,
        // чтобы контроллер мог вернуть 404
        return null;
    }

    const requiredFields = ['childName', 'parentName', 'parentPhone', 'address', 'hourlyRate'];
    for (const field of requiredFields) {
      if (childData.hasOwnProperty(field) && !childData[field]) { // Проверяем только если поле есть в childData
        throw ApiError.badRequest(`${field} is required`);
      }
    }
    // Обновляем только для данного пользователя
    const [updatedChild] = await knex('children').where({ uuid, user_uuid: userId }).update(childData).returning('*');
    return updatedChild;
  }

  async deleteChild(uuid, userId) {
    // Удаляем только для данного пользователя
    return knex('children').where({ uuid, user_uuid: userId }).del();
  }
}

module.exports = new ChildrenService();