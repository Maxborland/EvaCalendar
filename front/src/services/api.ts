import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'; // Убедитесь, что это соответствует вашему бэкенду

export interface ExpenseCategory {
  id: string;
  category_name: string;
}

export interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface Child {
  id: string;
  childName: string;
  parentName: string;
  parentPhone: string | null;
  address: string | null;
  hourlyRate: number | null;
  comment: string | null;
}

export interface Task {
  uuid: string | undefined;
  title: string;
  type: string; // 'fixed', 'hourly', 'expense'
  time?: string;
  address?: string;
  childId?: string;
  hourlyRate?: number;
  category?: string; // или ExpenseCategory если это объект
  amountEarned?: number;
  amountSpent?: number;
  hoursWorked?: number;
  // weekId: string; // Удалено
  // dayOfWeek: number; // Удалено
  dueDate: string;
  comments?: string;
  isDone?: boolean;
  isPaid?: boolean;
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

// Удалена функция getTasksByWeekAndDay

export const createTask = (taskData: Task) => {
  return api.post('/tasks', taskData);
};

export const updateTask = (id: string, taskData: Partial<Task>) => {
  return api.put(`/tasks/${id}`, taskData);
};

export const deleteTask = (id: string) => {
  return api.delete(`/tasks/${id}`);
};

export const duplicateTask = (id: string) => {
  return api.post(`/tasks/${id}/duplicate`);
};

// export const getTasksByDateRange = async (startDate: string, endDate: string): Promise<Task[]> => {
//   const response = await api.get('/api/tasks', { params: { startDate, endDate } });
//   return response.data as Task[];
// };

export const getAllTasks = async (): Promise<Task[]> => {
  const response = await api.get('/tasks');
  return response.data as Task[];
};

export const moveTask = async (taskId: string, newDueDate: string): Promise<Task> => {
  const response = await api.put(`/tasks/${taskId}`, { dueDate: newDueDate });
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

export const updateExpenseCategory = async (id: string, category_name: string) => {
    const response = await api.put(`/expense-categories/${id}`, { category_name });
    return response.data;
};

export const deleteExpenseCategory = async (id: string) => {
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

export const getChildById = async (id: string) => {
    const response = await api.get(`/children/${id}`);
    return response.data as Child;
};

export const addChild = async (child: Omit<Child, 'id'>) => {
    const response = await api.post('/children', child);
    return response.data as Child;
};

export const updateChild = async (id: string, child: Child) => {
    // Деструктурируем объект child, чтобы исключить поле 'id' из тела запроса
    // При этом, childIdToExclude будет содержать значение id, но не будет отправлено в childDataToSend
    const { id: childIdToExclude, ...childDataToSend } = child;
    const response = await api.put(`/children/${id}`, childDataToSend);
    return response.data as Child;
};

export const deleteChild = async (id: string) => {
    const response = await api.delete(`/children/${id}`);
    return response.data;
};

export default api;