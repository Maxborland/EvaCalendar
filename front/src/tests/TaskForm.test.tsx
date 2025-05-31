import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TaskForm from '../components/TaskForm';
import { createTask, updateTask, type Task } from '../services/api';

import { vi } from 'vitest';

vi.mock('../services/api', () => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
  getExpenseCategories: vi.fn(() => Promise.resolve([
    { id: '1', category_name: 'Еда' },
    { id: '2', category_name: 'Транспорт' },
  ])),
  getAllChildren: vi.fn(() => Promise.resolve([
    { id: 'child1', childName: 'Петя', hourlyRate: 600, address: 'Онлайн', parentName: 'Мама Пети', parentPhone: '+7 (111) 222-33-44' },
    { id: 'child2', childName: 'Вася', hourlyRate: 500, address: 'Оффлайн', parentName: 'Папа Васи', parentPhone: '+7 (444) 555-66-77' },
  ])),
  getChildById: vi.fn((id) => {
    if (id === 'child1') {
      return Promise.resolve({
        id: 'child1',
        childName: 'Петя',
        hourlyRate: 600,
        address: 'Онлайн',
        parentName: 'Мама Пети',
        parentPhone: '+7 (111) 222-33-44',
      });
    }
    if (id === 'child2') {
      return Promise.resolve({
        id: 'child2',
        childName: 'Вася',
        hourlyRate: 500,
        address: 'Оффлайн',
        parentName: 'Папа Васи',
        parentPhone: '+7 (444) 555-66-77',
      });
    }
    return Promise.resolve(null);
  }),
}));

const mockOnTaskSaved = vi.fn();
const mockOnClose = vi.fn();
const defaultProps = {
  onTaskSaved: mockOnTaskSaved,
  onClose: mockOnClose,
};

// Helper to create initialData for creation mode
const getCreationInitialData = (type: 'income' | 'expense'): Partial<Task> & { type: 'income' | 'expense' } => ({
    uuid: undefined, // Явно указываем uuid как undefined
    type: type,
  });


describe('TaskForm', () => {
  let modalRoot: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    modalRoot = document.createElement('div');
    modalRoot.setAttribute('id', 'modal-root');
    document.body.appendChild(modalRoot);
  });

  afterEach(() => {
    if (document.body.contains(modalRoot)) {
        document.body.removeChild(modalRoot);
    }
    document.body.innerHTML = '';
  });

  // Тест 1: Рендеринг формы для создания новой задачи (доход)
  test('рендерит форму для создания новой задачи (доход) корректно', async () => {
    render(<TaskForm {...defaultProps} initialData={getCreationInitialData('income')} />);

    await screen.findByRole('option', { name: 'Петя' });

    expect(await screen.findByRole('heading', { name: 'Создать новое дело' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Создать дело' })).toBeInTheDocument();
    expect(screen.getByLabelText('Тип:')).toHaveValue('income');
    expect(screen.getByLabelText('Название:')).toBeInTheDocument();
    expect(screen.getByLabelText('Дата выполнения:')).toBeInTheDocument();
    expect(screen.getByLabelText('Время:')).toBeInTheDocument();
    expect(screen.getByLabelText('Выбрать ребенка:')).toBeInTheDocument();

    await waitFor(() => {
        expect(screen.queryByLabelText('Имя ребенка:')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Адрес:')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Ставка (₽/час):')).not.toBeInTheDocument();
    });

    expect(screen.getByLabelText('Часов отработано:')).toBeInTheDocument();
    expect(screen.getByLabelText('Комментарии:')).toBeInTheDocument();
    expect(screen.queryByLabelText('Категория:')).not.toBeInTheDocument();
    expect(createTask).not.toHaveBeenCalled();
    expect(updateTask).not.toHaveBeenCalled();
  });

  // Тест 2: Рендеринг формы для создания новой задачи (расход)
  test('рендерит форму для создания новой задачи (расход) корректно', async () => {
    render(<TaskForm {...defaultProps} initialData={getCreationInitialData('expense')} />);

    await screen.findByRole('option', { name: 'Еда' });

    expect(await screen.findByRole('heading', { name: 'Создать новое дело' })).toBeInTheDocument();
    expect(screen.getByLabelText('Дата выполнения:')).toBeInTheDocument();
    expect(screen.getByLabelText('Описание расхода:')).toBeInTheDocument();
    expect(screen.getByLabelText('Потрачено:')).toBeInTheDocument();
    expect(screen.getByLabelText('Комментарии:')).toBeInTheDocument();
    expect(screen.getByLabelText('Категория:')).toBeInTheDocument();
    expect(screen.queryByLabelText('Ставка (₽/час):')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Часов отработано:')).not.toBeInTheDocument();
  });

  // Тест 3: Отправка формы для создания задачи (доход)
  test('отправляет форму для создания задачи (доход) и вызывает createTask', async () => {
    render(<TaskForm {...defaultProps} initialData={getCreationInitialData('income')} />);
    await screen.findByLabelText('Выбрать ребенка:');
    fireEvent.change(screen.getByLabelText('Выбрать ребенка:'), { target: { value: 'child1' } });
    await waitFor(() => {
      expect(screen.getByLabelText('Имя ребенка:')).toHaveValue('Петя');
      expect(screen.getByLabelText('Адрес:')).toHaveValue('Онлайн');
      expect(screen.getByLabelText('Ставка (₽/час):')).toHaveValue(600);
    });
    fireEvent.change(screen.getByLabelText('Дата выполнения:'), { target: { value: '2024-06-15' } });
    fireEvent.change(screen.getByLabelText('Название:'), { target: { value: 'Урок математики с Петей' } });
    fireEvent.change(screen.getByLabelText('Время:'), { target: { value: '10:00' } });
    fireEvent.change(screen.getByLabelText('Часов отработано:'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Комментарии:'), { target: { value: 'Отличный урок' } });
    fireEvent.click(screen.getByRole('button', { name: 'Создать дело' }));
    await waitFor(() => {
      expect(createTask).toHaveBeenCalledTimes(1);
      expect(createTask).toHaveBeenCalledWith(expect.objectContaining({
        type: 'income', title: 'Урок математики с Петей', dueDate: '2024-06-15',
        time: '10:00', address: 'Онлайн', childId: 'child1',
        hourlyRate: 600, hoursWorked: 2, amountEarned: 1200, comments: 'Отличный урок',
      }));
      expect(mockOnTaskSaved).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // Тест 4: Отправка формы для создания задачи (расход)
  test('отправляет форму для создания задачи (расход) и вызывает createTask', async () => {
    render(<TaskForm {...defaultProps} initialData={getCreationInitialData('expense')} />);
    await screen.findByLabelText('Категория:');
    fireEvent.change(screen.getByLabelText('Дата выполнения:'), { target: { value: '2024-06-16' } });
    fireEvent.change(screen.getByLabelText('Описание расхода:'), { target: { value: 'Покупка продуктов' } });
    fireEvent.change(screen.getByLabelText('Потрачено:'), { target: { value: '1500' } });
    fireEvent.change(screen.getByLabelText('Комментарии:'), { target: { value: 'На ужин' } });
    fireEvent.change(screen.getByLabelText('Категория:'), { target: { value: 'Еда' } });
    fireEvent.click(screen.getByRole('button', { name: 'Создать дело' }));
    await waitFor(() => {
      expect(createTask).toHaveBeenCalledTimes(1);
      expect(createTask).toHaveBeenCalledWith(expect.objectContaining({
        type: 'expense', title: 'Покупка продуктов', dueDate: '2024-06-16',
        amountSpent: 1500, comments: 'На ужин', category: 'Еда',
      }));
      expect(mockOnTaskSaved).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // Тест 5: Рендеринг формы для редактирования существующей задачи (доход)
  test('рендерит форму для редактирования существующей задачи (доход) корректно', async () => {
    const initialData = {
      uuid: 'task-uuid-123', type: 'income' as 'income', title: 'Репетиторство',
      dueDate: '2024-06-10', time: '14:00', childId: 'child1',
      hoursWorked: 1.5, amountEarned: 900, comments: 'Подготовка к ЕГЭ',
    } as Partial<Task> & { type: 'income' | 'expense' };
    render(<TaskForm {...defaultProps} initialData={initialData} />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Редактировать дело' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Сохранить' })).toBeInTheDocument();
      expect(screen.getByLabelText('Дата выполнения:')).toHaveValue('2024-06-10');
      expect(screen.getByLabelText('Название:')).toHaveValue('Репетиторство');
      expect(screen.getByLabelText('Время:')).toHaveValue('14:00');
      expect(screen.getByLabelText('Выбрать ребенка:')).toHaveValue('child1');
      expect(screen.getByLabelText('Имя ребенка:')).toHaveValue('Петя');
      expect(screen.getByLabelText('Адрес:')).toHaveValue('Онлайн');
      expect(screen.getByLabelText('Ставка (₽/час):')).toHaveValue(600);
      expect(screen.getByLabelText('Имя родителя:')).toHaveValue('Мама Пети');
      expect(screen.getByLabelText('Телефон родителя:')).toHaveValue('+7 (111) 222-33-44');
      expect(screen.getByLabelText('Часов отработано:')).toHaveValue(1.5);
      expect(screen.getByLabelText('Комментарии:')).toHaveValue('Подготовка к ЕГЭ');
    });
  });

  // Тест 6: Отправка формы для редактирования задачи (доход)
  test('отправляет форму для редактирования задачи (доход) и вызывает updateTask', async () => {
    const initialData = {
      uuid: 'task-uuid-123', type: 'income' as 'income', title: 'Репетиторство',
      dueDate: '2024-06-10', time: '14:00', childId: 'child1',
      hoursWorked: 1.5, comments: 'Подготовка к ЕГЭ',
    } as Partial<Task> & { type: 'income' | 'expense' };
    render(<TaskForm {...defaultProps} initialData={initialData} />);
    await screen.findByLabelText('Ставка (₽/час):', {}, { timeout: 3000 });
    fireEvent.change(screen.getByLabelText('Дата выполнения:'), { target: { value: '2024-06-11' } });
    fireEvent.change(screen.getByLabelText('Название:'), { target: { value: 'Новое название урока' } });
    await screen.findByLabelText('Выбрать ребенка:');
    fireEvent.change(screen.getByLabelText('Выбрать ребенка:'), { target: { value: 'child2' } });
    await waitFor(() => {
      expect(screen.getByLabelText('Ставка (₽/час):')).toHaveValue(500);
      expect(screen.getByLabelText('Адрес:')).toHaveValue('Оффлайн');
    }, { timeout: 3000 });
    fireEvent.change(screen.getByLabelText('Часов отработано:'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledTimes(1);
      expect(updateTask).toHaveBeenCalledWith('task-uuid-123', expect.objectContaining({
        uuid: 'task-uuid-123', type: 'income', title: 'Новое название урока',
        dueDate: '2024-06-11', childId: 'child2', hourlyRate: 500,
        hoursWorked: 2, amountEarned: 1000,
      }));
      expect(mockOnTaskSaved).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // Тест 7: Рендеринг формы для редактирования существующей задачи (расход)
  test('рендерит форму для редактирования существующей задачи (расход) корректно', async () => {
    const initialData = {
      uuid: 'task-uuid-456', type: 'expense' as 'expense', title: 'Обед в кафе',
      dueDate: '2024-06-12', amountSpent: 350, comments: 'Бизнес-ланч', category: 'Еда',
    } as Partial<Task> & { type: 'income' | 'expense' };
    render(<TaskForm {...defaultProps} initialData={initialData} />);
    await waitFor(async () => {
      expect(screen.getByRole('heading', { name: 'Редактировать дело' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Сохранить' })).toBeInTheDocument();
      expect(screen.getByLabelText('Дата выполнения:')).toHaveValue('2024-06-12');
      expect(screen.getByLabelText('Описание расхода:')).toHaveValue('Обед в кафе');
      expect(screen.getByLabelText('Потрачено:')).toHaveValue(350);
      expect(screen.getByLabelText('Комментарии:')).toHaveValue('Бизнес-ланч');
      expect(await screen.findByLabelText('Категория:')).toHaveValue('Еда');
    });
  });

  // Тест 8: Отправка формы для редактирования задачи (расход)
  test('отправляет форму для редактирования задачи (расход) и вызывает updateTask', async () => {
    const initialData = {
      uuid: 'task-uuid-456', type: 'expense' as 'expense', title: 'Обед в кафе',
      dueDate: '2024-06-12', amountSpent: 350, comments: 'Бизнес-ланч', category: 'Еда',
    } as Partial<Task> & { type: 'income' | 'expense' };
    render(<TaskForm {...defaultProps} initialData={initialData} />);
    await screen.findByLabelText('Категория:');
    fireEvent.change(screen.getByLabelText('Дата выполнения:'), { target: { value: '2024-06-13' } });
    fireEvent.change(screen.getByLabelText('Описание расхода:'), { target: { value: 'Ужин дома' } });
    fireEvent.change(screen.getByLabelText('Потрачено:'), { target: { value: '800' } });
    fireEvent.change(screen.getByLabelText('Категория:'), { target: { value: 'Транспорт' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledTimes(1);
      expect(updateTask).toHaveBeenCalledWith('task-uuid-456', expect.objectContaining({
        uuid: 'task-uuid-456', type: 'expense', title: 'Ужин дома',
        dueDate: '2024-06-13', amountSpent: 800, category: 'Транспорт',
      }));
      expect(mockOnTaskSaved).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // Тест 9: Закрытие формы по клику на фон
  test('закрывает форму при клике на фон', async () => {
    render(<TaskForm {...defaultProps} initialData={getCreationInitialData('income')} />);
    await screen.findByRole('heading', { name: 'Создать новое дело' });
    fireEvent.click(screen.getByTestId('modal-overlay'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Тест 10: Закрытие формы по клику на кнопку закрытия
  test('закрывает форму при клике на кнопку закрытия', async () => {
    render(<TaskForm {...defaultProps} initialData={getCreationInitialData('income')} />);
    await screen.findByRole('heading', { name: 'Создать новое дело' });
    fireEvent.click(screen.getByText('×'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Тест 11: Валидация required полей для дохода
  test('отображает ошибки валидации для required полей дохода', async () => {
    render(<TaskForm {...defaultProps} initialData={getCreationInitialData('income')} />);
    await screen.findByLabelText('Название:');
    const createButtonInitial = await screen.findByRole('button', { name: 'Создать дело' });
    expect(createButtonInitial).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Дата выполнения:'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Название:'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Время:'), { target: { value: '' } });

    const createButtonAfterChanges = await screen.findByRole('button', { name: 'Создать дело' });
    fireEvent.click(createButtonAfterChanges);
    await waitFor(() => {
        expect(createTask).not.toHaveBeenCalled();
    });
  });

  // Тест 12: Валидация required полей для расхода
  test('отображает ошибки валидации для required полей расхода', async () => {
    render(<TaskForm {...defaultProps} initialData={getCreationInitialData('expense')} />);
    await screen.findByLabelText('Тип:');
    await screen.findByLabelText('Категория:');
    const createButtonInitial = await screen.findByRole('button', { name: 'Создать дело' });
    expect(createButtonInitial).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Дата выполнения:'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Описание расхода:'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Потрачено:'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Категория:'), { target: { value: '' } });

    const createButtonAfterChanges = await screen.findByRole('button', { name: 'Создать дело' });
    fireEvent.click(createButtonAfterChanges);
    await waitFor(() => {
        expect(createTask).not.toHaveBeenCalled();
    });
  });
});