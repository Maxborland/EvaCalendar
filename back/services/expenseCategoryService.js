const knex = require('../db.cjs');
const { v4: uuidv4 } = require('uuid');
const ApiError = require('../utils/ApiError');

const ALLOWED_FIELDS = ['categoryName'];

function sanitize(data) {
    const result = {};
    for (const field of ALLOWED_FIELDS) {
        if (data.hasOwnProperty(field)) {
            result[field] = data[field];
        }
    }
    return result;
}

class ExpenseCategoryService {
    async createExpenseCategory(categoryData, userId) {
        if (!categoryData.categoryName) {
            throw ApiError.badRequest('categoryName is required');
        }
        const newUuid = uuidv4();
        const [createdCategory] = await knex('expense_categories')
            .insert({ uuid: newUuid, user_uuid: userId, ...sanitize(categoryData) })
            .returning('*');
        return createdCategory;
    }

    async getAllExpenseCategories(userId) {
        return knex('expense_categories').where({ user_uuid: userId }).select('*');
    }

    async getExpenseCategoryById(uuid, userId) {
        return knex('expense_categories').where({ uuid, user_uuid: userId }).first();
    }

    async updateExpenseCategory(uuid, categoryData, userId) {
        const existingCategory = await knex('expense_categories').where({ uuid, user_uuid: userId }).first();
        if (!existingCategory) {
            return null;
        }

        if (categoryData.hasOwnProperty('categoryName') && !categoryData.categoryName) {
            throw ApiError.badRequest('categoryName is required');
        }
        const [updatedCategory] = await knex('expense_categories')
            .where({ uuid, user_uuid: userId })
            .update(sanitize(categoryData))
            .returning('*');
        return updatedCategory;
    }

    async deleteExpenseCategory(uuid, userId) {
        const deletedCount = await knex('expense_categories').where({ uuid, user_uuid: userId }).del();
        return deletedCount > 0;
    }
}

module.exports = new ExpenseCategoryService();