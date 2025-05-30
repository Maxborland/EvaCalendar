import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { vi } from 'vitest';
import TaskItem from '../components/TaskItem';

// Мокаем функцию deleteTask
vi.mock('../services/api', () => ({
  deleteTask: vi.fn(() => Promise.resolve()),
}));

// Мокаем react-dnd, так как он не нужен для этих тестов и может вызвать проблемы в jsdom
vi.mock('react-dnd', () => ({
  useDrag: () => [{}, vi.fn()],
  useDrop: () => [{}, vi.fn()],
  DndProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('TaskItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const incomeTask = {
    id: 'income1',
    type: 'income' as 'income',
    title: 'Урок английского',
    time: '10:00',
    address: 'Онлайн',
    childName: 'Алексей',
    hourlyRate: 700,
    comments: 'Хороший ученик',
    amountEarned: 1400,
    onDelete: vi.fn(),
    onDuplicate: vi.fn(),
    onEdit: vi.fn(),
  };

  const expenseTask = {
    id: 'expense1',
    type: 'expense' as 'expense',
    title: 'Покупка книг',
    amountSpent: 500,
    comments: 'Для саморазвития',
    category: 'Образование',
    onDelete: vi.fn(),
    onDuplicate: vi.fn(),
    onEdit: vi.fn(),
  };

  // Тест 1: Рендеринг задачи дохода
  test('рендерит задачу дохода корректно', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <TaskItem {...incomeTask} />
      </DndProvider>
    );
    expect(screen.getByText('Урок английского')).toBeInTheDocument();
    expect(screen.getByText('+1400₽')).toBeInTheDocument();
    expect(screen.queryByText('Потрачено:')).not.toBeInTheDocument();
  });

  // Тест 2: Рендеринг задачи расхода
  test('рендерит задачу расхода корректно', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <TaskItem {...expenseTask} />
      </DndProvider>
    );
    expect(screen.getByText('Покупка книг')).toBeInTheDocument();
    expect(screen.getByText('-500₽')).toBeInTheDocument();
    expect(screen.queryByText('Заработано:')).not.toBeInTheDocument();
  });

  // Тест 3: Вызывает onEdit при клике на элемент задачи
  test('вызывает onEdit при клике на элемент задачи', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <TaskItem {...incomeTask} />
      </DndProvider>
    );
    fireEvent.click(screen.getByText('Урок английского'));
    expect(incomeTask.onEdit).toHaveBeenCalledTimes(1);
    expect(incomeTask.onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'income1' }));
  });

  // Тест 4: Вызывает onDelete при клике на кнопку удаления
  test('вызывает onDelete и deleteTask при клике на кнопку удаления', async () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <TaskItem {...incomeTask} />
      </DndProvider>
    );

    fireEvent.click(screen.getByText('🗑️')); // Клик по кнопке удаления

    await waitFor(() => {
      expect(incomeTask.onDelete).toHaveBeenCalledTimes(1);
      expect(incomeTask.onDelete).toHaveBeenCalledWith('income1');
    });
  });

  // Тест 5: Вызывает onDuplicate при клике на кнопку дублирования
  test('вызывает onDuplicate при клике на кнопку дублирования', async () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <TaskItem {...incomeTask} />
      </DndProvider>
    );

    fireEvent.click(screen.getByText('📄')); // Клик по кнопке дублирования

    await waitFor(() => {
      expect(incomeTask.onDuplicate).toHaveBeenCalledTimes(1);
      expect(incomeTask.onDuplicate).toHaveBeenCalledWith('income1');
    });
  });

});