import { v4 as uuidv4 } from 'uuid';
import knex from '../db.cjs';

class NoteService {
  async getNoteByWeekId(weekId) {
    return knex('notes').where({ weekId }).first();
  }

  async createOrUpdateNote(weekId, content) {
    const existingNote = await this.getNoteByWeekId(weekId);
    if (existingNote) {
      await knex('notes').where({ weekId }).update({ content });
      return { id: existingNote.id, weekId, content };
    } else {
      const newId = uuidv4();
      await knex('notes').insert({ id: newId, weekId, content });
      return { id: newId, weekId, content };
    }
  }

  async deleteNote(weekId) {
    return knex('notes').where({ weekId }).del();
  }
}

export default new NoteService();