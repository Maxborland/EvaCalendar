const taskService = require('../services/taskService');

class TaskController {
  async getTasksByWeekAndDay(req, res) {
    const { weekId, dayOfWeek } = req.params;
    try {
      const tasks = await taskService.findTasksByWeekAndDay(weekId, dayOfWeek);
      res.status(200).json(tasks);
    } catch (error) {
      console.error('Ошибка при получении задач:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
    }
  }

  async createTask(req, res) {
    const task = req.body;
    // TODO: Добавить валидацию входящих данных
    try {
      const newTask = await taskService.createTask(task);
      res.status(201).json(newTask);
    } catch (error) {
      console.error('Ошибка при создании задачи:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
    }
  }

  async updateTask(req, res) {
    const { id } = req.params;
    const task = req.body;
    // TODO: Добавить валидацию входящих данных
    try {
      const updatedTask = await taskService.updateTask(id, task);
      if (updatedTask) {
        res.status(200).json(updatedTask);
      } else {
        res.status(404).json({ message: 'Задача не найдена.' });
      }
    } catch (error) {
      console.error('Ошибка при обновлении задачи:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
    }
  }

  async deleteTask(req, res) {
    const { id } = req.params;
    try {
      const deletedCount = await taskService.deleteTask(id);
      if (deletedCount > 0) {
        res.status(204).send(); // No Content
      } else {
        res.status(404).json({ message: 'Задача не найдена.' });
      }
    } catch (error) {
      console.error('Ошибка при удалении задачи:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
    }
  }

  async duplicateTask(req, res) {
    const { id } = req.params;
    try {
      const originalTask = await taskService.findTaskById(id);
      if (!originalTask) {
        return res.status(404).json({ message: 'Оригинальная задача не найдена.' });
      }

      // Создаем копию задачи, исключая id и обновляя дату создания
      const duplicatedTask = {
        ...originalTask,
        id: undefined, // Knex автоматически сгенерирует новый ID
      };

      const newTask = await taskService.createTask(duplicatedTask);
      res.status(201).json(newTask);
    } catch (error) {
      console.error('Ошибка при дублировании задачи:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
    }
  }

  async moveTask(req, res) {
    const { taskId, newWeekId, newDayOfWeek } = req.body;
    try {
      const task = await taskService.findTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Задача не найдена.' });
      }

      await taskService.updateTask(taskId, { weekId: newWeekId, dayOfWeek: newDayOfWeek });
      const updatedTask = await taskService.findTaskById(taskId);
      res.status(200).json(updatedTask);
    } catch (error) {
      console.error('Ошибка при перемещении задачи:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
    }
  }
}

module.exports = new TaskController();