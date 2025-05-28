import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  createTask,
  createWeek,
  deleteTask,
  duplicateTask,
  fetchCategories,
  fetchSummary,
  fetchTasksByWeek,
  moveTask,
  updateTask
} from '../utils/api';
import { addWeeks, formatDate, getCurrentDate, getStartOfWeek } from '../utils/helpers';

export interface Category {
  id: number;
  name: string;
}

export interface Task {
  id?: number;
  weekStart: string;
  dayOfWeek: number; // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  date: string; // YYYY-MM-DD
  position: number;
  type: 'order' | 'expense';
  title: string;
  time?: string;
  address?: string;
  childName?: string;
  hourlyRate?: number;
  amount?: number;
  comment?: string;
  category?: string; // For expenses
}

export interface Summary {
  totalEarnings: number;
  totalExpenses: number;
}

interface AppContextType {
  currentDate: Date;
  currentWeekStart: Date;
  tasks: Task[];
  categories: Category[];
  summary: Summary;
  loading: boolean;
  error: string | null;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  goToToday: () => void;
  addTask: (task: Task) => Promise<void>;
  updateTask: (id: number, task: Task) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  duplicateTask: (id: number) => Promise<void>;
  moveTask: (id: number, newDayOfWeek: number, newPosition: number, newWeekStart: string, newDate: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDate, setCurrentDate] = useState<Date>(getCurrentDate());
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(getCurrentDate()));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalEarnings: 0, totalExpenses: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Ensure the week exists in the backend
      await createWeek(formatDate(currentWeekStart));

      const fetchedTasks = await fetchTasksByWeek(formatDate(currentWeekStart));
      setTasks(fetchedTasks);

      const fetchedCategories = await fetchCategories();
      setCategories(fetchedCategories);

      const fetchedSummary = await fetchSummary({ weekStart: formatDate(currentWeekStart) });
      setSummary(fetchedSummary);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const goToPreviousWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, -1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  };

  const goToToday = () => {
    const today = getCurrentDate();
    setCurrentDate(today);
    setCurrentWeekStart(getStartOfWeek(today));
  };

  const handleAddTask = async (task: Task) => {
    try {
      await createTask(task);
      await loadData(); // Refresh data after adding
    } catch (err: any) {
      setError(err.message);
      throw err; // Re-throw to allow component to handle
    }
  };

  const handleUpdateTask = async (id: number, task: Task) => {
    try {
      await updateTask(id, task);
      await loadData(); // Refresh data after updating
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await deleteTask(id);
      await loadData(); // Refresh data after deleting
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleDuplicateTask = async (id: number) => {
    try {
      await duplicateTask(id);
      await loadData(); // Refresh data after duplicating
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const handleMoveTask = async (id: number, newDayOfWeek: number, newPosition: number, newWeekStart: string, newDate: string) => {
    try {
      await moveTask(id, newDayOfWeek, newPosition, newWeekStart, newDate);
      await loadData(); // Refresh data after moving
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    currentDate,
    currentWeekStart,
    tasks,
    categories,
    summary,
    loading,
    error,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
    addTask: handleAddTask,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    duplicateTask: handleDuplicateTask,
    moveTask: handleMoveTask,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};