const { v4: uuidv4 } = require('uuid');
const knex = require('../db.cjs');
const ApiError = require('../utils/ApiError');

const TABLE_NAME = 'notes';

class NoteService {
    async createNote(noteData) {
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
                content: noteData.content
            };
            await knex(TABLE_NAME).insert(newNote);
            return newNote;
        } catch (error) {
            console.error('Ошибка при создании заметки:', error);
            throw error;
        }
    }

    async getAllNotes() {
        try {
            return await knex(TABLE_NAME).select('*');
        } catch (error) {
            console.error('Ошибка при получении всех заметок:', error);
            throw new Error('Не удалось получить заметки.');
        }
    }

    async getNoteById(uuid) {
        try {
            return await knex(TABLE_NAME).where({ uuid }).first();
        } catch (error) {
            console.error(`Ошибка при получении заметки с UUID ${uuid}:`, error);
            throw new Error('Не удалось получить заметку по UUID.');
        }
    }
async getNotesByDate(dateString) {
        try {
            return await knex(TABLE_NAME).where({ date: dateString }).select('*');
        } catch (error) {
            console.error(`Ошибка при получении заметок по дате ${dateString}:`, error);
            throw new Error('Не удалось получить заметки по дате.');
        }
    }

    async updateNote(uuid, noteData) {
        try {
            if (!noteData || typeof noteData.content === 'undefined') {
                throw ApiError.badRequest('content is required for update');
            }

            const dataToUpdate = { content: noteData.content };

            const [updatedNote] = await knex(TABLE_NAME)
                .where({ uuid })
                .update(dataToUpdate, ['uuid', 'date', 'content']);

            if (!updatedNote) {
                return null;
            }
            return updatedNote;
        } catch (error) {
            console.error(`Ошибка при обновлении заметки с UUID ${uuid}:`, error);
            throw error;
        }
    }

    async deleteNote(uuid) {
        try {
            const deletedRows = await knex(TABLE_NAME).where({ uuid }).del();
            return deletedRows > 0;
        } catch (error) {
            console.error(`Ошибка при удалении заметки с UUID ${uuid}:`, error);
            throw new Error('Не удалось удалить заметку.');
        }
    }
}

module.exports = new NoteService();