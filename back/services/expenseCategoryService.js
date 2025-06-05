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
            // Добавляем user_uuid при создании
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
            // Фильтруем по user_uuid
            return await knex('expense_categories').where({ user_uuid: userId }).select('*');
        } catch (error) {
            console.error('Error getting all expense categories:', error);
            throw error;
        }
    }

    async getExpenseCategoryById(uuid, userId) {
        try {
            // Фильтруем по uuid и user_uuid
            return await knex('expense_categories').where({ uuid, user_uuid: userId }).first();
        } catch (error) {
            console.error('Error getting expense category by UUID:', error);
            throw error;
        }
    }

    async updateExpenseCategory(uuid, categoryData, userId) {
        try {
            // Сначала проверяем, существует ли категория и принадлежит ли она пользователю
            const existingCategory = await knex('expense_categories').where({ uuid, user_uuid: userId }).first();
            if (!existingCategory) {
                return null; // Контроллер вернет 404
            }

            const requiredFields = ['categoryName'];
            for (const field of requiredFields) {
                // Проверяем только если поле есть в categoryData и оно пустое
                if (categoryData.hasOwnProperty(field) && !categoryData[field]) {
                    throw ApiError.badRequest(`${field} is required`);
                }
            }
            // Обновляем только для данного пользователя
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
            // Удаляем только для данного пользователя
            const deletedCount = await knex('expense_categories').where({ uuid, user_uuid: userId }).del();
            return deletedCount > 0;
        } catch (error) {
            console.error('Error deleting expense category:', error);
            throw error;
        }
    }
}

module.exports = new ExpenseCategoryService();