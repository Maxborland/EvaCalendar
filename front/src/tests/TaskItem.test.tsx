import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { vi } from 'vitest';
import TaskItem from '../components/TaskItem';
import type { Task } from '../services/api';

vi.mock('../services/api', () => ({
  deleteTask: vi.fn(() => Promise.resolve()),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  getExpenseCategories: vi.fn(() => Promise.resolve([])),
  getAllChildren: vi.fn(() => Promise.resolve([])),
  getChildById: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, vi.fn(), vi.fn()],
  useDrop: () => [{ canDrop: false, isOver: false }, vi.fn()],
  DndProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('TaskItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockOnDelete = vi.fn();
  const mockOnDuplicate = vi.fn();
  const mockOnEdit = vi.fn();

  const incomeTaskData: Task = {
    uuid: 'income-uuid-1',
    type: 'income', // Тип 'income' должен быть одним из 'fixed', 'hourly', 'expense'. Уточним на 'hourly' для дохода.
                     // Однако, компонент TaskItem не валидирует это строго, он просто отображает.
                     // Оставим 'income' как есть, если это соответствует логике отображения.
                     // Судя по TaskForm, тип 'income' валиден.
    title: 'Урок английского',
    dueDate: '2024-01-15',
    time: '10:00',
    address: 'Онлайн',
    childId: 'child-alex', // Заменено childUuid на childId
    hourlyRate: 700,
    hoursWorked: 2,
    comments: 'Хороший ученик',
    amountEarned: 1400,
    completed: false, // Исправлено с isDone на completed в соответствии с типом Task
    // weekId и dayOfWeek удалены, так как их нет в актуальном типе Task
  };

  const expenseTaskData: Task = {
    uuid: 'expense-uuid-1',
    type: 'expense',
    title: 'Покупка книг',
    dueDate: '2024-01-16',
    amountSpent: 500,
    comments: 'Для саморазвития',
    expenseCategoryName: 'Образование', // Исправлено с category на expenseCategoryName
    completed: false, // Исправлено с isDone на completed
    // weekId и dayOfWeek удалены
  };

  test('рендерит задачу дохода корректно', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <TaskItem task={incomeTaskData} onDelete={mockOnDelete} onDuplicate={mockOnDuplicate} onEdit={mockOnEdit} />
      </DndProvider>
    );
    expect(screen.getByText(incomeTaskData.title!)).toBeInTheDocument();
    expect(screen.getByText(`+${incomeTaskData.amountEarned}₽`)).toBeInTheDocument();
    expect(screen.queryByText('Потрачено:')).not.toBeInTheDocument();
  });

  test('рендерит задачу расхода корректно', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <TaskItem task={expenseTaskData} onDelete={mockOnDelete} onDuplicate={mockOnDuplicate} onEdit={mockOnEdit} />
      </DndProvider>
    );
    expect(screen.getByText(expenseTaskData.title!)).toBeInTheDocument();
    expect(screen.getByText(`-${expenseTaskData.amountSpent}₽`)).toBeInTheDocument();
    expect(screen.queryByText('Заработано:')).not.toBeInTheDocument();
  });

  test('вызывает onEdit при клике на элемент задачи', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <TaskItem task={incomeTaskData} onDelete={mockOnDelete} onDuplicate={mockOnDuplicate} onEdit={mockOnEdit} />
      </DndProvider>
    );
    fireEvent.click(screen.getByText(incomeTaskData.title!));
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(incomeTaskData);
  });

  test('вызывает onDelete при клике на кнопку удаления', async () => {
    window.confirm = vi.fn(() => true);

    render(
      <DndProvider backend={HTML5Backend}>
        <TaskItem task={incomeTaskData} onDelete={mockOnDelete} onDuplicate={mockOnDuplicate} onEdit={mockOnEdit} />
      </DndProvider>
    );

    const buttons = screen.getAllByRole('button');
    let deleteBtn;
    buttons.forEach(button => {
      if (button.querySelector('[data-icon="trash"]')) {
        deleteBtn = button;
      }
    });
    expect(deleteBtn).toBeInTheDocument();
    fireEvent.click(deleteBtn!);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledWith(incomeTaskData.uuid);
    });
  });

  test('вызывает onDuplicate при клике на кнопку дублирования', async () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <TaskItem task={incomeTaskData} onDelete={mockOnDelete} onDuplicate={mockOnDuplicate} onEdit={mockOnEdit} />
      </DndProvider>
    );

    const buttons = screen.getAllByRole('button');
    let duplicateBtn;
    buttons.forEach(button => {
      if (button.querySelector('[data-icon="clone"]')) {
        duplicateBtn = button;
      }
    });
    expect(duplicateBtn).toBeInTheDocument();
    fireEvent.click(duplicateBtn!);

    await waitFor(() => {
      expect(mockOnDuplicate).toHaveBeenCalledTimes(1);
      expect(mockOnDuplicate).toHaveBeenCalledWith(incomeTaskData.uuid);
    });
  });
});