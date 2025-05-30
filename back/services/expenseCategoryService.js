import knex from '../db.cjs';
import ApiError from '../utils/ApiError.js';

class ExpenseCategoryService {
  async getAllCategories() {
    return knex('expense_categories').select('*');
  }

  async createCategory(category_name) {
    // Check if category name already exists
    const existingCategory = await knex('expense_categories').where({ category_name }).first();
    if (existingCategory) {
      throw ApiError.badRequest('Category with this name already exists');
    }

    const result = await knex('expense_categories').insert({ category_name }).returning('id');
    const id = result[0].id;
    return { id, category_name };
  }

  async updateCategory(id, category_name) {
    // Get the current category
    const currentCategory = await knex('expense_categories').where({ id }).first();
    if (!currentCategory) {
      return false; // Category not found
    }

    // If the name is the same, no need to check uniqueness
    if (currentCategory.category_name === category_name) {
      return true; // Имя не изменилось, нет необходимости в обновлении
    }

    // Check if category name already exists for another category
    const existingCategory = await knex('expense_categories').where({ category_name }).whereNot({ id }).first();
    if (existingCategory) {
      throw ApiError.badRequest('Category with this name already exists');
    }

    const updatedRows = await knex('expense_categories').where({ id }).update({ category_name });
    return updatedRows > 0;
  }

  async deleteCategory(id) {
    const deletedRows = await knex('expense_categories').where({ id }).del();
    return deletedRows > 0;
  }
}

export default new ExpenseCategoryService();