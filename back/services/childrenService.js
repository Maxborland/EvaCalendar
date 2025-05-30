import knex from '../db.cjs';

class ChildService {
  async getAllChildren() {
    return knex('children').select('*');
  }

  async getChildById(id) {
    return knex('children').where({ id }).first();
  }

  async addChild(child) {
    const [newChildId] = await knex('children').insert(child);
    return knex('children').where({ id: newChildId }).first();
  }

  async updateChild(id, child) {
    await knex('children').where({ id }).update(child);
    return knex('children').where({ id }).first();
  }

  async deleteChild(id) {
    return knex('children').where({ id }).del();
  }
}

export default new ChildService();