import knex from '../db.js';

class ExpenseCategoryService {
  async getAllCategories() {
    return knex('expense_categories').select('*');
  }

  async createCategory(category_name) {
    const [id] = await knex('expense_categories').insert({ category_name }).returning('id');
    return { id, category_name };
  }
}

export default new ExpenseCategoryService();