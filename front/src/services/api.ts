import axios from 'axios';

const API_URL = 'http://localhost:3001'; // Убедитесь, что это соответствует вашему бэкенду

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

export default api;