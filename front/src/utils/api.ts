const API_BASE_URL = 'http://localhost:3001';

export const fetchCategories = async () => {
  const response = await fetch(`${API_BASE_URL}/categories`);
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
};

export const fetchTasksByWeek = async (startDate: string) => {
  const response = await fetch(`${API_BASE_URL}/weeks/${startDate}/tasks`);
  if (!response.ok) {
    throw new Error('Failed to fetch tasks by week');
  }
  return response.json();
};

export const fetchTasksByDate = async (date: string) => {
  const response = await fetch(`${API_BASE_URL}/tasks/date/${date}`);
  if (!response.ok) {
    throw new Error('Failed to fetch tasks by date');
  }
  return response.json();
};

export const createTask = async (task: any) => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create task');
  }
  return response.json();
};

export const updateTask = async (id: number, task: any) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update task');
  }
  return response.json();
};

export const deleteTask = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete task');
  }
  return response.json();
};

export const duplicateTask = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}/duplicate`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to duplicate task');
  }
  return response.json();
};

export const moveTask = async (id: number, newDayOfWeek: number, newPosition: number, newWeekStart: string, newDate: string) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}/move`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newDayOfWeek, newPosition, newWeekStart, newDate }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to move task');
  }
  return response.json();
};

export const fetchSummary = async (params: { date?: string; weekStart?: string }) => {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/summary?${query}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch summary');
  }
  return response.json();
};

export const createWeek = async (startDate: string) => {
  const response = await fetch(`${API_BASE_URL}/weeks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ startDate }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create week');
  }
  return response.json();
};