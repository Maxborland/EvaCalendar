import axios from 'axios';

const API_URL = 'http://localhost:3001'; // Убедитесь, что это соответствует вашему бэкенду

export interface ExpenseCategory {
  id: number;
  category_name: string;
}

export interface SummaryData {
  totalIncome: number;
  totalExpense: number;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  return api.post(`/tasks/move`, { taskId, newWeekId, newDayOfWeek });
};

export const getWeeklySummary = async (weekId: string) => {
  const response = await api.get(`/summary/${weekId}`);
  return response.data as SummaryData;
};

export const getDailySummary = async (weekId: string, dayOfWeek: string) => {
  const response = await api.get(`/summary/${weekId}/${dayOfWeek}`);
  return response.data as SummaryData;
};

export const getExpenseCategories = async () => {
    const response = await api.get('/expense-categories');
    return response.data as ExpenseCategory[];
};

export default api;