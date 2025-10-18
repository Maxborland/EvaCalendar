import axios from 'axios';
import { toast } from 'react-toastify';



const API_URL = import.meta.env.VITE_API_URL || '';

export interface ExpenseCategory {
  uuid: string; // Changed from id to uuid to match API response
  categoryName: string;
}

// Переименовываем MonthlySummary в MonthSummaryValues, чтобы избежать конфликта с типом для getMonthlySummary
export interface MonthSummaryValues {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  calculatedForMonth: string;
}

export interface DailySummary {
  totalIncome: number;
  totalExpenses: number;
  calculatedForDate: string;
}

export interface SummaryData { // Этот тип для getSummaryByWeek
  monthlySummary: MonthSummaryValues;
  dailySummary: DailySummary;
}

// Новый тип для ответа функции getMonthlySummary
export interface MonthlySummaryAPIResponse {
  totalEarned: number;
  totalSpent: number;
  balance: number;
  // calculatedForMonth может отсутствовать в этом старом эндпоинте, или его нужно добавить на бэке
  // Пока что сделаем его опциональным или будем формировать на клиенте
}

// Старый интерфейс SummaryData, который использовался для getMonthlySummary, переименуем
// и будем использовать для возвращаемого значения getMonthlySummary
export interface OldMonthlySummaryData {
    totalIncome: number;
    totalExpense: number; // В старом интерфейсе было totalExpense
    balance: number;
    calculatedForMonth?: string;
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
  type: 'income' | 'expense' | 'task' | 'hourly' | 'fixed' | 'lesson'; // 'fixed', 'hourly', 'expense', 'income', 'lesson'
  time?: string; // Может быть eventTime или taskTime от бэкенда
  dueDate: string; // Может быть date от бэкенда
  completed?: boolean; // Изменено с isDone
  childId?: string; // Изменено с child_id на camelCase для соответствия данным с бэкенда
  childName?: string;
  expense_category_uuid?: string; // Изменено с category_id и expenseTypeId
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
  taskType?: 'income' | 'expense' | 'task'; // Добавлено для явного указания типа задачи фронтендом
  createdAt?: string;
  updatedAt?: string;
  reminder_at?: string | null;
  reminder_offset?: number | null;
  assigned_to_id?: string | null;
  creator?: User;
  assignee?: User;
  assignee_username?: string;
  user_uuid?: string;
  child_uuid?: string;
}

export interface Note {
  uuid: string;
  date: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  uuid: string;
  username: string;
  email: string;
  role: 'user' | 'admin'; // Предполагаем, что роли могут быть только 'user' или 'admin'
}

export interface NewUserCredentials {
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

const api = axios.create({
  baseURL: `${API_URL}/api`,
withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Перехватчик запросов для добавления JWT токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // URL-адреса, для которых не нужно добавлять токен авторизации
    const noAuthEndpoints = ['/auth/login', '/auth/register'];
    const isAuthPath = noAuthEndpoints.some(path => config.url?.endsWith(path));

    if (token && config.url && !isAuthPath) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Устанавливаем перехватчик один раз при инициализации модуля
api.interceptors.response.use(
  response => response,
  error => {
    // Проверяем, является ли ошибка ответом с кодом 401
    if (error.response && error.response.status === 401) {
      // Исключаем эндпоинт входа, чтобы избежать бесконечного цикла редиректов
      // Проверяем, что URL существует и не является эндпоинтом для входа
      if (error.config.url && !error.config.url.endsWith('/auth/login')) {
        // Очищаем токен из localStorage, чтобы избежать проблем при следующем входе
        localStorage.removeItem('token');
        // Принудительно перенаправляем пользователя на страницу входа
        window.location.href = '/login';
        // Прерываем дальнейшую обработку ошибки, чтобы избежать лишних действий
        return new Promise(() => {});
      }
    }

    // Для всех остальных ошибок (включая 401 на странице входа)
    // позволяем ошибке "всплыть" для локальной обработки в компонентах.
    // Можно добавить более сложную логику отображения уведомлений здесь, если потребуется.
    let errorMessage = 'Произошла неизвестная ошибка!';
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Показываем уведомление для всех ошибок, кроме 401, которые приводят к редиректу.
    if (!error.response || error.response.status !== 401) {
        toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);
// Больше нет setupApiInterceptors, перехватчик установлен выше

export const getNoteByDate = async (dateString: string): Promise<Note[]> => {
  try {
    const response = await api.get<Note[]>(`notes/date/${dateString}`);
    return response.data; // API должен возвращать массив, даже если он пустой
  } catch (error: any) {
    // Ошибка будет обработана глобальным interceptor'ом
    // Если API возвращает 404, когда заметок нет, это будет обработано как ошибка.
    // Если ожидается пустой массив, то 404 не должно быть.
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

export const createTask = (taskData: Omit<Task, 'uuid'>) => {
  return api.post<Task>('/tasks', taskData);
};

export const updateTask = (uuid: string, taskData: Partial<Omit<Task, 'uuid'>>) => {
  return api.put<Task>(`/tasks/${uuid}`, taskData);
};

export const deleteTask = (uuid: string) => {
  return api.delete(`/tasks/${uuid}`);
};

export const duplicateTask = (uuid: string) => {
  return api.post<Task>(`/tasks/${uuid}/duplicate`);
};

export const getAllTasks = async (): Promise<Task[]> => {
  const response = await api.get('/tasks');
  return response.data as Task[];
};

export const moveTask = async (taskUuid: string, newDueDate: string): Promise<Task> => {
  const response = await api.put(`/tasks/${taskUuid}`, { dueDate: newDueDate });
  return response.data as Task;
};

export const getSummaryByWeek = async (weekStartDate: string): Promise<SummaryData> => {
  const response = await api.get<SummaryData>(`/summary/summary-by-week`, {
    params: { weekStartDate }
  });
  return response.data;
};

export const getDailySummary = async (date: string): Promise<{ totalEarned: number, totalSpent: number } | null> => {
  try {
    const response = await api.get(`/summary/daily?date=${date}`);
    return response.data;
  } catch (error) {
    // Error fetching daily summary
    return null;
  }
};

export const getMonthlySummary = async (year: number, month: number): Promise<OldMonthlySummaryData> => {
  const response = await api.get<MonthlySummaryAPIResponse>(`/summary/month/${year}/${month}`);
  // Преобразуем totalEarned и totalSpent в totalIncome и totalExpense
  // Формируем calculatedForMonth на клиенте, если его нет в ответе
  const monthString = month.toString().padStart(2, '0');
  const calculatedForMonth = `${year}-${monthString}`;

  return {
    totalIncome: response.data.totalEarned,
    totalExpense: response.data.totalSpent, // Сохраняем totalExpense как в OldMonthlySummaryData
    balance: response.data.balance,
    calculatedForMonth: calculatedForMonth
  };
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

  // User management API calls
  export const getUsers = async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
  };

  export const updateUserRole = async (userUuid: string, role: 'user' | 'admin'): Promise<User> => {
    const response = await api.put<User>(`/users/${userUuid}/role`, { role });
    return response.data;
  };

  export const updateUserPassword = async (userUuid: string, password: string): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>(`/users/${userUuid}/password`, { password });
    return response.data;
  };

  export const createUser = async (userData: NewUserCredentials): Promise<User> => {
    const response = await api.post<User>('/users', userData);
    return response.data;
  };

  export const deleteUser = async (userUuid: string): Promise<{ message: string }> => {
    // Бэкенд может возвращать 204 No Content или объект с сообщением.
    // Для единообразия предположим, что он возвращает объект с сообщением.
    const response = await api.delete<{ message: string }>(`/users/${userUuid}`);
    return response.data;
  };

  export const searchUsers = async (query: string): Promise<User[]> => {
    const response = await api.get<User[]>(`/users/search?q=${query}`);
    return response.data;
  };

  export const getAssignableUsers = async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users/assignable');
    return response.data;
  };

  export default api;