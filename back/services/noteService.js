const { v4: uuidv4 } = require('uuid');
const knex = require('../db.cjs');
const ApiError = require('../utils/ApiError');

const TABLE_NAME = 'notes';

class NoteService {
    async createNote(noteData, userId) {
        try {
            const requiredFields = ['date', 'content'];
            for (const field of requiredFields) {
                if (!noteData[field]) {
                    throw ApiError.badRequest(`${field} is required`);
                }
            }
            const newNote = {
                uuid: uuidv4(),
                date: noteData.date,
                content: noteData.content,
                user_uuid: userId, // Добавлено user_uuid
            };
            await knex(TABLE_NAME).insert(newNote);
            return newNote;
        } catch (error) {
            console.error('Ошибка при создании заметки:', error);
            throw error;
        }
    }

    async getAllNotes(userId) {
        try {
            return await knex(TABLE_NAME).where({ user_uuid: userId }).select('*');
        } catch (error) {
            console.error('Ошибка при получении всех заметок:', error);
            throw new Error('Не удалось получить заметки.');
        }
    }

    async getNoteById(uuid, userId) {
        try {
            return await knex(TABLE_NAME).where({ uuid, user_uuid: userId }).first();
        } catch (error) {
            console.error(`Ошибка при получении заметки с UUID ${uuid}:`, error);
            throw new Error('Не удалось получить заметку по UUID.');
        }
    }

    async getNotesByDate(dateString, userId) {
        try {
            // Возвращаем все заметки для указанной даты
            const notes = await knex(TABLE_NAME).where({ date: dateString, user_uuid: userId }).select('*');
            return notes; // Возвращаем массив заметок (может быть пустым)
        } catch (error) {
            console.error(`Ошибка при получении заметок по дате ${dateString}:`, error);
            throw new Error('Не удалось получить заметки по дате.');
        }
    }

    async updateNote(uuid, noteData, userId) {
        try {
            if (!noteData || typeof noteData.content === 'undefined') { // date не обязательно для обновления контента
                throw ApiError.badRequest('content is required for update');
            }

            const dataToUpdate = { content: noteData.content };
            // Если передана дата, ее тоже можно обновить, но это не основной сценарий для заметок.
            // Пока обновляем только content. Если нужно обновлять дату, логику нужно расширить.

            const [updatedNote] = await knex(TABLE_NAME)
                .where({ uuid, user_uuid: userId }) // Добавлена проверка user_uuid
                .update(dataToUpdate, ['uuid', 'date', 'content']);

            if (!updatedNote) {
                return null; // Заметка не найдена или не принадлежит пользователю
            }
            return updatedNote;
        } catch (error) {
            console.error(`Ошибка при обновлении заметки с UUID ${uuid}:`, error);
            throw error;
        }
    }

    async deleteNote(uuid, userId) {
        try {
            const deletedRows = await knex(TABLE_NAME).where({ uuid, user_uuid: userId }).del();
            return deletedRows > 0;
        } catch (error) {
            console.error(`Ошибка при удалении заметки с UUID ${uuid}:`, error);
            throw new Error('Не удалось удалить заметку.');
        }
    }
}

module.exports = new NoteService();