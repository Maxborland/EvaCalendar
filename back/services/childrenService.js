import { v4 as uuidv4 } from 'uuid';
import knex from '../db.cjs';

class ChildService {
  async getAllChildren() {
    return knex('children').select('*');
  }

  async getChildById(id) {
    return knex('children').where({ childId: id }).first();
  }

  async addChild(child) {
    const newChildId = uuidv4();
    await knex('children').insert({ childId: newChildId, ...child });
    return knex('children').where({ childId: newChildId }).first();
  }

  async updateChild(id, child) {
    await knex('children').where({ childId: id }).update(child);
    return knex('children').where({ childId: id }).first();
  }

  async deleteChild(id) {
    return knex('children').where({ childId: id }).del();
  }
}

export default new ChildService();