import noteService from '../services/noteService.js';

class NoteController {
  async getNoteByWeekId(req, res) {
    try {
      const { weekId } = req.params;
      const note = await noteService.getNoteByWeekId(weekId);
      if (note) {
        res.json(note);
      } else {
        res.json({}); // Возвращаем пустой объект JSON, если заметка не найдена
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async createOrUpdateNote(req, res) {
    try {
      const { weekId, content } = req.body;
      const note = await noteService.createOrUpdateNote(weekId, content);
      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async deleteNote(req, res) {
    try {
      const { weekId } = req.params;
      await noteService.deleteNote(weekId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default new NoteController();