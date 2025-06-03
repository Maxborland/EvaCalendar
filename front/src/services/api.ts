import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'; // Убедитесь, что это соответствует вашему бэкенду

export interface ExpenseCategory {
  uuid: string; // Changed from id to uuid to match API response
  categoryName: string;
}

export interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface Child {
  uuid: string; // Было id
  childName: string;
  parentName: string;
  parentPhone: string | null;
  address: string | null;
  hourlyRate: number | null;
  comment: string | null;
}

export interface Task {
  uuid: string; // Возвращаем uuid, так как API его возвращает
  title: string;
  description?: string; // Добавлено поле description
  type: string; // 'fixed', 'hourly', 'expense', 'income' (добавим income для унификации)
  time?: string; // Может быть eventTime или taskTime от бэкенда
  dueDate: string; // Может быть date от бэкенда
  completed?: boolean; // Изменено с isDone
  childId?: string; // Изменено с child_id на camelCase для соответствия данным с бэкенда
  childName?: string;
  expenseTypeId?: string; // Изменено с category_id
  expenseCategoryName?: string;
  amount?: number; // Общее поле для суммы (доход/расход)
  amountEarned?: number; // Добавлено для явного получения с бэкенда
  amountSpent?: number; // Добавлено для явного получения с бэкенда
  hourlyRate?: number; // Для почасовых задач
  hoursWorked?: number; // Для почасовых задач
  isPaid?: boolean; // Для отслеживания оплаты
  address?: string;
  parentName?: string;
  parentPhone?: string;
  childAddress?: string;
  childHourlyRate?: number; // Добавлено для ставки ребенка
  comments?: string; // Переименовано из description для заметок к задаче
  taskType?: 'income' | 'expense'; // Добавлено для явного указания типа задачи фронтендом
  createdAt?: string;
  updatedAt?: string;
}

export interface Note {
  uuid: string;
  date: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  response => response,
  error => {
    let errorMessage = 'Произошла неизвестная ошибка!';
    if (error.response) {
      // Сервер ответил со статусом, отличным от 2xx
      if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else {
        errorMessage = `Ошибка: ${error.response.status} - ${error.response.statusText}`;
      }
    } else if (error.request) {
      // Запрос был сделан, но ответа не получено
      errorMessage = 'Нет ответа от сервера. Проверьте ваше сетевое подключение.';
    } else {
      // Что-то пошло не так при настройке запроса
      errorMessage = error.message;
    }
    toast.error(errorMessage);
    return Promise.reject(error);
  }
);

// Notes API
export const getNoteByDate = async (dateString: string): Promise<Note | null> => {
  try {
    const response = await api.get<Note>(`notes/date/${dateString}`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null; // Заметка не найдена
    }
    // Ошибка будет обработана глобальным interceptor'ом
    throw error;
  }
};

export const createNote = async (dateString: string, content: string): Promise<Note> => {
  const response = await api.post<Note>('/notes', { date: dateString, content });
  return response.data;
};

export const updateNote = async (uuid: string, content: string): Promise<Note> => {
  const response = await api.put<Note>(`/notes/${uuid}`, { content });
  return response.data;
};

export const getAllNotes = async (): Promise<Note[]> => {
  const response = await api.get('/notes');
  return response.data as Note[];
};

export const getTasksForDay = async (dateString: string): Promise<Task[]> => {
  const response = await api.get(`/tasks/for-day?date=${dateString}`);
  return response.data as Task[];
};
// Удалена функция getTasksByWeekAndDay

export const createTask = (taskData: Omit<Task, 'uuid'>) => { // Убираем uuid при создании
  return api.post<Task>('/tasks', taskData); // Указываем тип возвращаемого значения
};

export const updateTask = (uuid: string, taskData: Partial<Omit<Task, 'uuid'>>) => { // Используем uuid, убираем uuid из данных
  return api.put<Task>(`/tasks/${uuid}`, taskData); // Указываем тип возвращаемого значения
};

export const deleteTask = (uuid: string) => {
  return api.delete(`/tasks/${uuid}`);
};

export const duplicateTask = (uuid: string) => {
  return api.post<Task>(`/tasks/${uuid}/duplicate`); // Указываем тип возвращаемого значения
};

// export const getTasksByDateRange = async (startDate: string, endDate: string): Promise<Task[]> => {
//   const response = await api.get('/api/tasks', { params: { startDate, endDate } });
//   return response.data as Task[];
// };

export const getAllTasks = async (): Promise<Task[]> => {
  const response = await api.get('/tasks');
  return response.data as Task[];
};

export const moveTask = async (taskUuid: string, newDueDate: string): Promise<Task> => {
  const response = await api.put(`/tasks/${taskUuid}`, { dueDate: newDueDate });
  return response.data as Task;
};

export const getWeeklySummary = async (weekId: string) => {
  const response = await api.get(`/summary/${weekId}`);
  return response.data as SummaryData;
};

export const getDailySummary = async (date: string): Promise<{ totalEarned: number, totalSpent: number } | null> => {
  try {
    const response = await api.get(`/summary/daily?date=${date}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    // Возвращаем null или выбрасываем ошибку в зависимости от требований к обработке ошибок
    // В данном случае, чтобы соответствовать возможному null из Promise.resolve(null) ранее, вернем null
    // Если API всегда должен возвращать данные или ошибку, то лучше throw error;
    return null;
  }
};

export const getMonthlySummary = async (year: number, month: number) => {
  const response = await api.get(`/summary/month/${year}/${month}`);
  return response.data as { totalEarned: number; totalSpent: number; balance: number; };
};

export const getExpenseCategories = async () => {
    const response = await api.get('/expense-categories');
    return response.data as ExpenseCategory[];
};

export const createExpenseCategory = async (categoryName: string) => {
    const response = await api.post('/expense-categories', { categoryName });
    return response.data;
};

export const updateExpenseCategory = async (id: string, categoryName: string) => {
    const response = await api.put(`/expense-categories/${id}`, { categoryName });
    return response.data;
};

export const deleteExpenseCategory = async (id: string) => {
    const response = await api.delete(`/expense-categories/${id}`);
    return response.data;
};

export const getTasksByCategory = async (categoryUuid: string) => {
  return api.get(`/tasks/by-category-uuid/${categoryUuid}`);
};

// Children API
export const getAllChildren = async () => {
    const response = await api.get('/children');
    return response.data as Child[];
};

export const getChildByUuid = async (uuid: string) => { // Было getChildById(id: string)
    const response = await api.get(`/children/${uuid}`); // Было /children/${id}
    return response.data as Child;
};

export const addChild = async (child: Omit<Child, 'uuid'>) => { // Было Omit<Child, 'id'>
    const response = await api.post('/children', child);
    return response.data as Child; // Бэкенд вернет Child с сгенерированным uuid
};

export const updateChild = async (uuid: string, child: Child) => { // Было id: string
    // Деструктурируем объект child, чтобы исключить поле 'uuid' из тела запроса
    const { uuid: childUuidToExclude, ...childDataToSend } = child; // Было id: childIdToExclude
    const response = await api.put(`/children/${uuid}`, childDataToSend); // Было /children/${id}
    return response.data as Child;
};

export const deleteChild = async (uuid: string) => { // Было id: string
    const response = await api.delete(`/children/${uuid}`); // Было /children/${id}
    return response.data;
};

export default api;