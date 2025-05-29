const weekService = require('../services/weekService');

class WeekController {
  async getWeek(req, res) {
    const { date } = req.query; // Предполагаем, что дата передается как query-параметр

    if (!date) {
      return res.status(400).json({ error: 'Параметр "date" обязателен.' });
    }

    try {
      const week = await weekService.findWeekByDate(date);
      if (week) {
        res.status(200).json(week);
      } else {
        res.status(404).json({ message: 'Неделя не найдена.' });
      }
    } catch (error) {
      console.error('Ошибка при получении недели:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
    }
  }

  async createWeek(req, res) {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Параметры "startDate" и "endDate" обязательны.' });
    }

    // Здесь можно добавить более сложную валидацию дат

    try {
      const existingWeek = await weekService.findWeekByDate(startDate);
      if (existingWeek) {
        // Если неделя уже существует, возвращаем ее ID
        return res.status(200).json({ id: existingWeek.id, startDate: existingWeek.startDate, endDate: existingWeek.endDate });
      }

      const newWeek = await weekService.createWeek({ startDate, endDate });
      res.status(201).json(newWeek);
    } catch (error) {
      console.error('Ошибка при создании недели:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
    }
  }
}

module.exports = new WeekController();