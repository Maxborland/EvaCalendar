import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import api from '../services/api';

// Предполагаемая структура задачи. Уточните при необходимости.
import type { Task } from '../services/api';

interface TaskContextType {
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;
  refetchTasks: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/tasks');
      setTasks(response.data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const contextValue = {
    tasks,
    isLoading,
    error,
    refetchTasks: fetchTasks,
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};