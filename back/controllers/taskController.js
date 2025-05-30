import asyncHandler from 'express-async-handler';
import { body, param, query, validationResult } from 'express-validator';
import taskService from '../services/taskService.js';
import ApiError from '../utils/ApiError.js';

class TaskController {
  getTasksByWeekAndDay = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Debugging: Log validation errors
      console.log('Ошибки валидации:', errors.array());
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const { weekId, dayOfWeek } = req.params;
    const tasks = await taskService.findTasksByWeekAndDay(weekId, dayOfWeek);
    res.status(200).json(tasks);
  });

  getTasksByCategory = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const { name: categoryName } = req.query;
    let decodedCategory = categoryName;

    // Пробуем декодировать, если это строка, что важно для кириллицы
    if (typeof categoryName === 'string') {
        try {
            decodedCategory = decodeURIComponent(categoryName);
        } catch (e) {
            // Если декодирование не удалось, логируем ошибку, но продолжаем
            // Возможно, это не URI-кодированная строка, а просто название
            console.error(`Ошибка декодирования URI для категории "${categoryName}":`, e.message);
        }
    }

    console.log(`Получена категория: ${categoryName}, Декодированная категория: ${decodedCategory}`);

    let tasks;
    // Проверяем, является ли декодированная категория числом
    if (!isNaN(decodedCategory) && !isNaN(parseFloat(decodedCategory))) {
        // Если это число, передаем его как ID
        tasks = await taskService.findTasksByCategory(parseInt(decodedCategory, 10));
    } else {
        // Если это строка, используем как название категории
        tasks = await taskService.findTasksByCategory(decodedCategory);
    }
    res.status(200).json(tasks);
  });

  createTask = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const task = req.body;
    console.log('Данные задачи, полученные в контроллере createTask:', task); // Добавлен лог
    const newTask = await taskService.createTask(task);
    res.status(201).json(newTask);
  });

  updateTask = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const task = req.body;
    console.log('Данные задачи, полученные в контроллере updateTask:', task); // Добавлен лог
    const updatedTask = await taskService.updateTask(id, task);
    if (updatedTask) {
      res.status(200).json(updatedTask);
    } else {
      return next(ApiError.notFound('Задача не найдена.'));
    }
  });

  deleteTask = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const { id } = req.params;
    const deletedCount = await taskService.deleteTask(id);
    if (deletedCount > 0) {
      res.status(204).send(); // No Content
    } else {
      return next(ApiError.notFound('Задача не найдена.'));
    }
  });

  duplicateTask = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const { id } = req.params;
    const originalTask = await taskService.findTaskById(id);
    if (!originalTask) {
      return next(ApiError.notFound('Оригинальная задача не найдена.'));
    }

    // Создаем копию задачи, исключая id и обновляя дату создания
    const duplicatedTask = {
      ...originalTask,
      id: undefined, // Knex автоматически сгенерирует новый ID
    };

    const newTask = await taskService.createTask(duplicatedTask);
    res.status(201).json(newTask);
  });

  moveTask = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Ошибки валидации', errors.array()));
    }
    const { taskId, newWeekId, newDayOfWeek } = req.body;
    if (!taskId || newWeekId === undefined || !newDayOfWeek) {
      return next(ApiError.badRequest('Отсутствуют обязательные поля: taskId, newWeekId, newDayOfWeek.'));
    }
    const taskExists = await taskService.findTaskById(taskId);
    if (!taskExists) {
      return next(ApiError.notFound('Задача не найдена.'));
    }

    const updatedTaskResult = await taskService.updateTask(taskId, { newWeekId, newDayOfWeek });

    if (updatedTaskResult) {
      res.status(200).json(updatedTaskResult);
    } else {
      return next(ApiError.notFound('Задача не найдена после попытки обновления.'));
    }
  });
}

export default new TaskController();

export const validateTask = {
  getTasksByWeekAndDay: [
    param('weekId').isUUID().withMessage('weekId должен быть валидным UUID.'),
    param('dayOfWeek').isString().isIn(['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']).withMessage('Неверное значение для dayOfWeek.'),
  ],
  getTasksByCategory: [
    query('name').custom(value => {
      // Пробуем декодировать на случай, если это URI-кодированная строка
      let decodedValue = value;
      if (typeof value === 'string') {
        try {
          decodedValue = decodeURIComponent(value);
        } catch (e) {
          throw new Error('Некорректное URI-кодирование для категории.');
        }
      }

      // Если это UUID, это валидно
      if (typeof decodedValue === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(decodedValue)) {
        return true;
      }

      // Если это строка, и она непустая, это валидно (название категории)
      if (typeof decodedValue === 'string' && decodedValue.trim() !== '') {
        return true;
      }

      throw new Error('Категория должна быть валидным UUID или непустой строкой.');
    }).withMessage('Категория должна быть корректным UUID или непустой строкой.'),
  ],
  createTask: [
    body('weekId').isUUID().withMessage('weekId должен быть валидным UUID.'),
    body('dayOfWeek').isString().isIn(['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']).withMessage('Неверное значение для dayOfWeek.'),
    body('type').isIn(['income', 'expense', 'babysitting', 'work']).withMessage('Неверный тип задачи.'),
    body('title').isString().notEmpty().withMessage('Заголовок обязателен.'),
    body('time').optional({ nullable: true }).isString().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Неверный формат времени. Используйте HH:MM.'),
    body('address').optional({ nullable: true }).isString().withMessage('Адрес должен быть строкой.'),
    body('childId').optional({ nullable: true }).isUUID().withMessage('ID ребенка должен быть валидным UUID.'),
    body('hourlyRate').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Ставка должна быть положительным числом.'),
    body('comments').optional({ nullable: true }).isString().withMessage('Комментарии должны быть строкой.'),
    body('category').optional({ nullable: true }).isString().withMessage('Категория должна быть строкой.'),
    body('amountEarned').optional().isFloat({ min: 0 }).withMessage('AmountEarned должен быть положительным числом.'),
    body('amountSpent').optional().isFloat({ min: 0 }).withMessage('AmountSpent должен быть положительным числом.'),
    body('hoursWorked').optional().isFloat({ min: 0 }).withMessage('HoursWorked должен быть положительным числом.'),
  ],
  updateTask: [
    param('id').isUUID().withMessage('ID задачи должен быть валидным UUID.'),
    body('weekId').optional().isUUID().withMessage('weekId должен быть валидным UUID.'),
    body('dayOfWeek').optional().isString().isIn(['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']).withMessage('Неверное значение для dayOfWeek.'),
    body('type').optional().isIn(['income', 'expense', 'babysitting', 'work']).withMessage('Неверный тип задачи.'),
    body('title').optional().isString().notEmpty().withMessage('Заголовок обязателен.'),
    body('time').optional({ nullable: true }).isString().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Неверный формат времени. Используйте HH:MM.'),
    body('address').optional({ nullable: true }).isString().withMessage('Адрес должен быть строкой.'),
    body('childId').optional({ nullable: true }).isUUID().withMessage('ID ребенка должен быть валидным UUID.'),
    body('hourlyRate').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Ставка должна быть положительным числом.'),
    body('comments').optional({ nullable: true }).isString().withMessage('Комментарии должны быть строкой.'),
    body('category').optional({ nullable: true }).isString().withMessage('Категория должна быть строкой.'),
    body('amountEarned').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('AmountEarned должен быть положительным числом.'),
    body('amountSpent').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('AmountSpent должен быть положительным числом.'),
    body('hoursWorked').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('HoursWorked должен быть положительным числом.'),
  ],
  deleteTask: [
    param('id').isUUID().withMessage('ID задачи должен быть валидным UUID.'),
  ],
  duplicateTask: [
    param('id').isUUID().withMessage('ID задачи должен быть валидным UUID.'),
  ],
  moveTask: [
    body('taskId').isUUID().withMessage('ID задачи должен быть валидным UUID.'),
    body('newWeekId').isUUID().withMessage('Новый weekId должен быть валидным UUID.'),
    body('newDayOfWeek').isString().isIn(['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']).withMessage('Неверное значение для newDayOfWeek.'),
  ],
};