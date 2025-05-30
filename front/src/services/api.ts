import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'; // Убедитесь, что это соответствует вашему бэкенду

export interface ExpenseCategory {
  id: number;
  category_name: string;
}

export interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface Child {
  id: number;
  childName: string;
  parentName: string;
  parentPhone: string | null;
  address: string | null;
  hourlyRate: number | null;
  comment: string | null;
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

export const getTasksByWeekAndDay = (weekId: string, dayOfWeek: string) => {
  return api.get(`/tasks/${weekId}/${dayOfWeek}`);
};

export const createTask = (taskData: any) => {
  return api.post('/tasks', taskData);
};

export const updateTask = (id: string, taskData: any) => {
  return api.put(`/tasks/${id}`, taskData);
};

export const deleteTask = (id: string) => {
  return api.delete(`/tasks/${id}`);
};

export const duplicateTask = (id: string) => {
  return api.post(`/tasks/${id}/duplicate`);
};

export const moveTask = (taskId: string, newWeekId: string, newDayOfWeek: string) => {
  return api.put(`/tasks/move`, { taskId, newWeekId, newDayOfWeek });
};

export const getWeeklySummary = async (weekId: string) => {
  const response = await api.get(`/summary/${weekId}`);
  return response.data as SummaryData;
};

export const getDailySummary = async (weekId: string, dayOfWeek: string) => {
  const response = await api.get(`/summary/${weekId}/${dayOfWeek}`);
  return response.data as SummaryData;
};

export const getMonthlySummary = async (year: number, month: number) => {
  const response = await api.get(`/summary/month/${year}/${month}`);
  return response.data as SummaryData;
};

export const getExpenseCategories = async () => {
    const response = await api.get('/expense-categories');
    return response.data as ExpenseCategory[];
};

export const createExpenseCategory = async (category_name: string) => {
    const response = await api.post('/expense-categories', { category_name });
    return response.data;
};

export const updateExpenseCategory = async (id: number, category_name: string) => {
    const response = await api.put(`/expense-categories/${id}`, { category_name });
    return response.data;
};

export const deleteExpenseCategory = async (id: number) => {
    const response = await api.delete(`/expense-categories/${id}`);
    return response.data;
};

export const getTasksByCategory = async (category: string) => {
  return api.get(`/tasks/category?name=${encodeURIComponent(category)}`);
};

// Children API
export const getAllChildren = async () => {
    const response = await api.get('/children');
    return response.data as Child[];
};

export const getChildById = async (id: number) => {
    const response = await api.get(`/children/${id}`);
    return response.data as Child;
};

export const addChild = async (child: Omit<Child, 'id'>) => {
    const response = await api.post('/children', child);
    return response.data as Child;
};

export const updateChild = async (id: number, child: Child) => {
    // Деструктурируем объект child, чтобы исключить поле 'id' из тела запроса
    // При этом, childIdToExclude будет содержать значение id, но не будет отправлено в childDataToSend
    const { id: childIdToExclude, ...childDataToSend } = child;
    const response = await api.put(`/children/${id}`, childDataToSend);
    return response.data as Child;
};

export const deleteChild = async (id: number) => {
    const response = await api.delete(`/children/${id}`);
    return response.data;
};

export default api;