const knex = require('../db.cjs');
const { v4: uuidv4 } = require('uuid');
const ApiError = require('../utils/ApiError');

class ExpenseCategoryService {
    async createExpenseCategory(categoryData, userId) {
        try {
            const requiredFields = ['categoryName'];
            for (const field of requiredFields) {
                if (!categoryData[field]) {
                    throw ApiError.badRequest(`${field} is required`);
                }
            }
            const newUuid = uuidv4();
            const [createdCategory] = await knex('expense_categories')
                .insert({ uuid: newUuid, user_uuid: userId, ...categoryData })
                .returning('*');
            return createdCategory;
        } catch (error) {
            console.error('Error creating expense category:', error);
            throw error;
        }
    }

    async getAllExpenseCategories(userId) {
        try {
            return await knex('expense_categories').where({ user_uuid: userId }).select('*');
        } catch (error) {
            console.error('Error getting all expense categories:', error);
            throw error;
        }
    }

    async getExpenseCategoryById(uuid, userId) {
        try {
            return await knex('expense_categories').where({ uuid, user_uuid: userId }).first();
        } catch (error) {
            console.error('Error getting expense category by UUID:', error);
            throw error;
        }
    }

    async updateExpenseCategory(uuid, categoryData, userId) {
        try {
            const existingCategory = await knex('expense_categories').where({ uuid, user_uuid: userId }).first();
            if (!existingCategory) {
                return null;
            }

            const requiredFields = ['categoryName'];
            for (const field of requiredFields) {
                if (categoryData.hasOwnProperty(field) && !categoryData[field]) {
                    throw ApiError.badRequest(`${field} is required`);
                }
            }
            const [updatedCategory] = await knex('expense_categories')
                .where({ uuid, user_uuid: userId })
                .update(categoryData)
                .returning('*');
            return updatedCategory;
        } catch (error) {
            console.error('Error updating expense category:', error);
            throw error;
        }
    }

    async deleteExpenseCategory(uuid, userId) {
        try {
            const deletedCount = await knex('expense_categories').where({ uuid, user_uuid: userId }).del();
            return deletedCount > 0;
        } catch (error) {
            console.error('Error deleting expense category:', error);
            throw error;
        }
    }
}

module.exports = new ExpenseCategoryService();