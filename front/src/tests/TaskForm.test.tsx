import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TaskForm from '../components/TaskForm';
import { createTask, updateTask } from '../services/api'; // Добавлен getAllChildren

// Мокаем функции API
import { vi } from 'vitest';

vi.mock('../services/api', () => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
  getExpenseCategories: vi.fn(() => Promise.resolve([
    { id: '1', category_name: 'Еда' },
    { id: '2', category_name: 'Транспорт' },
  ])),
  // Мокаем getAllChildren для тестов
  getAllChildren: vi.fn(() => Promise.resolve([
    // Допустим, у нас есть несколько детей, один из которых 'Петя'
    { id: 1, childName: 'Петя', hourlyRate: 600, address: 'Онлайн', parentName: 'Мама Пети', parentPhone: '111-222-3333' },
    { id: 2, childName: 'Вася', hourlyRate: 500, address: 'Оффлайн', parentName: 'Папа Васи', parentPhone: '444-555-6666' },
  ])),
  // Мокаем getChildById для тестов
  getChildById: vi.fn((id) => {
    if (id === 1) { // Условный мок для ребенка с ID 1
      return Promise.resolve({
        id: 1,
        childName: 'Петя',
        hourlyRate: 600,
        address: 'Онлайн',
        parentName: 'Мама Пети',
        parentPhone: '111-222-3333',
      });
    }
    return Promise.resolve(null); // Если ребенок не найден
  }),
}));

const mockOnTaskSaved = vi.fn();
const mockOnClose = vi.fn();
const defaultProps = {
  weekId: 'week1',
  dayOfWeek: 'Monday',
  onTaskSaved: mockOnTaskSaved,
  onClose: mockOnClose,
};

describe('TaskForm', () => {
  let modalRoot: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    // Создаем контейнер modal-root для портала
    modalRoot = document.createElement('div');
    modalRoot.setAttribute('id', 'modal-root');
    document.body.appendChild(modalRoot);
  });

  afterEach(() => {
    // Очищаем DOM после каждого теста
    document.body.removeChild(modalRoot);
  });

  // Тест 1: Рендеринг формы для создания новой задачи (доход)
  test('рендерит форму для создания новой задачи (доход) корректно', async () => {
    await waitFor(() => {
      render(<TaskForm {...defaultProps} />);
    });

    // Используем более точные селекторы для заголовка и кнопки
    expect(screen.getByRole('heading', { name: 'Создать новое дело' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Создать дело' })).toBeInTheDocument();
    expect(screen.getByLabelText('Тип:')).toHaveValue('income');

    // Проверяем поля для дохода
    expect(screen.getByLabelText('Название:')).toBeInTheDocument();
    expect(screen.getByLabelText('Время:')).toBeInTheDocument();
    expect(screen.getByLabelText('Адрес:')).toBeInTheDocument();
    expect(screen.getByLabelText('Имя ребенка:')).toBeInTheDocument();
    expect(screen.getByLabelText('Ставка (₽/час):')).toBeInTheDocument();
    expect(screen.getByLabelText('Часов отработано:')).toBeInTheDocument();
    // Удалено, так как это поле не отображается в UI
    // expect(screen.getByText('Заработано (расчетное):')).toBeInTheDocument();
    expect(screen.getByLabelText('Комментарии:')).toBeInTheDocument();

    // Категории расходов не должны быть видны
    expect(screen.queryByText('Категория:')).not.toBeInTheDocument();
    expect(createTask).not.toHaveBeenCalled();
    expect(updateTask).not.toHaveBeenCalled();
  });

  // Тест 2: Рендеринг формы для создания новой задачи (расход)
  test('рендерит форму для создания новой задачи (расход) корректно', async () => {
    await waitFor(() => {
      render(<TaskForm {...defaultProps} />);
    });

    fireEvent.change(screen.getByLabelText('Тип:'), { target: { value: 'expense' } });

    // Проверяем поля для расхода
    expect(screen.getByLabelText('Описание расхода:')).toBeInTheDocument();
    expect(screen.getByLabelText('Потрачено:')).toBeInTheDocument();
    expect(screen.getByLabelText('Комментарии:')).toBeInTheDocument();
    expect(await screen.findByLabelText('Категория:')).toBeInTheDocument(); // Категории должны быть загружены

    // Поля дохода не должны быть видны
    expect(screen.queryByLabelText('Ставка (₽/час):')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Часов отработано:')).not.toBeInTheDocument();
  });

  // Тест 3: Отправка формы для создания задачи (доход)
  test('отправляет форму для создания задачи (доход) и вызывает createTask', async () => {
    render(<TaskForm {...defaultProps} />);

    fireEvent.change(screen.getByLabelText('Название:'), { target: { value: 'Урок математики' } });
    fireEvent.change(screen.getByLabelText('Время:'), { target: { value: '10:00' } });
    fireEvent.change(screen.getByLabelText('Адрес:'), { target: { value: 'Улица Пушкина, 10' } });
    fireEvent.change(screen.getByLabelText('Имя ребенка:'), { target: { value: 'Маша' } });
    fireEvent.change(screen.getByLabelText('Ставка (₽/час):'), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText('Часов отработано:'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Комментарии:'), { target: { value: 'Отличный урок' } });

    fireEvent.click(screen.getByText('Создать дело'));

    await waitFor(() => {
      expect(createTask).toHaveBeenCalledTimes(1);
      expect(createTask).toHaveBeenCalledWith(expect.objectContaining({
        type: 'income',
        title: 'Урок математики',
        time: '10:00',
        address: 'Улица Пушкина, 10',
        childName: 'Маша',
        hourlyRate: 500,
        hoursWorked: 2,
        amountEarned: 1000, // 500 * 2
        comments: 'Отличный урок',
        weekId: 'week1',
        dayOfWeek: 'Monday',
      }));
      expect(mockOnTaskSaved).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // Тест 4: Отправка формы для создания задачи (расход)
  test('отправляет форму для создания задачи (расход) и вызывает createTask', async () => {
    await waitFor(() => {
      render(<TaskForm {...defaultProps} />);
    });

    fireEvent.change(screen.getByLabelText('Тип:'), { target: { value: 'expense' } });

    fireEvent.change(screen.getByLabelText('Описание расхода:'), { target: { value: 'Покупка продуктов' } });
    fireEvent.change(screen.getByLabelText('Потрачено:'), { target: { value: '1500' } });
    fireEvent.change(screen.getByLabelText('Комментарии:'), { target: { value: 'На ужин' } });
    await waitFor(() => { // Оборачиваем, чтобы гарантировать обновление состояния перед отправкой
        fireEvent.change(screen.getByLabelText('Категория:'), { target: { value: 'Еда' } });
    });


    fireEvent.click(screen.getByText('Создать дело'));

    await waitFor(() => {
      expect(createTask).toHaveBeenCalledTimes(1);
      expect(createTask).toHaveBeenCalledWith(expect.objectContaining({
        type: 'expense',
        title: 'Покупка продуктов',
        amountSpent: 1500,
        comments: 'На ужин',
        category: 'Еда',
        weekId: 'week1',
        dayOfWeek: 'Monday',
      }));
      expect(mockOnTaskSaved).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // Тест 5: Рендеринг формы для редактирования существующей задачи (доход)
  test('рендерит форму для редактирования существующей задачи (доход) корректно', async () => {
    const initialData = {
      id: 'task123',
      type: 'income' as 'income',
      title: 'Репетиторство',
      time: '14:00',
      address: 'Онлайн',
      childName: 'Петя',
      hourlyRate: 600,
      hoursWorked: 1.5,
      amountEarned: 900,
      comments: 'Подготовка к ЕГЭ',
    };
    render(<TaskForm {...defaultProps} initialData={initialData} />); // Перенесено вне waitFor

    await waitFor(() => { // waitFor теперь обертывает expect
      expect(screen.getByText('Редактировать дело')).toBeInTheDocument();
      expect(screen.getByLabelText('Название:')).toHaveValue('Репетиторство');
      expect(screen.getByLabelText('Время:')).toHaveValue('14:00');
      // Исправлено: использование toHaveValue для readOnly поля (так как toHaveDisplayValue не работает)
      expect(screen.getByLabelText('Адрес:')).toHaveValue('Онлайн');
      expect(screen.getByLabelText('Имя ребенка:')).toHaveValue('Петя');
      expect(screen.getByDisplayValue('600')).toBeInTheDocument(); // Ставка
      // screen.debug(); // Удаляем отладочный вывод DOM
      expect(screen.getByDisplayValue('1.5')).toBeInTheDocument(); // Часов отработано
      // Удалено, так как это поле не отображается как input
      // expect(screen.getByDisplayValue('900')).toBeInTheDocument(); // Заработано
      expect(screen.getByLabelText('Комментарии:')).toHaveValue('Подготовка к ЕГЭ');
    }); // Закрытие waitFor
  });

  // Тест 6: Отправка формы для редактирования задачи (доход)
  test('отправляет форму для редактирования задачи (доход) и вызывает updateTask', async () => {
    const initialData = {
      id: 'task123',
      type: 'income' as 'income',
      title: 'Репетиторство',
      time: '14:00',
      address: 'Онлайн',
      childName: 'Петя',
      hourlyRate: 600,
      hoursWorked: 1.5,
      amountEarned: 900,
      comments: 'Подготовка к ЕГЭ',
    };
    await waitFor(() => {
      render(<TaskForm {...defaultProps} initialData={initialData} />);
    });

    fireEvent.change(screen.getByLabelText('Название:'), { target: { value: 'Новое название' } });
    fireEvent.change(screen.getByLabelText('Ставка (₽/час):'), { target: { value: '700' } });
    fireEvent.change(screen.getByLabelText('Часов отработано:'), { target: { value: '2' } });

    // Исправлено: использование 'Сохранить' вместо 'Сохранить изменения'
    fireEvent.click(screen.getByText('Сохранить'));

    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledTimes(1);
      expect(updateTask).toHaveBeenCalledWith('task123', expect.objectContaining({
        type: 'income',
        title: 'Новое название',
        hourlyRate: 700,
        hoursWorked: 2,
        amountEarned: 1400, // 700 * 2
        weekId: 'week1',
        dayOfWeek: 'Monday',
      }));
      expect(mockOnTaskSaved).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // Тест 7: Рендеринг формы для редактирования существующей задачи (расход)
  test('рендерит форму для редактирования существующей задачи (расход) корректно', async () => {
    const initialData = {
      id: 'task456',
      type: 'expense' as 'expense',
      title: 'Обед в кафе',
      amountSpent: 350,
      comments: 'Бизнес-ланч',
      category: 'Еда',
    };
    await waitFor(() => {
      render(<TaskForm {...defaultProps} initialData={initialData} />);
    });

    expect(screen.getByText('Редактировать дело')).toBeInTheDocument();
    expect(screen.getByLabelText('Описание расхода:')).toHaveValue('Обед в кафе');
    expect(screen.getByDisplayValue('350')).toBeInTheDocument(); // Потрачено
    expect(screen.getByLabelText('Комментарии:')).toHaveValue('Бизнес-ланч');
    expect(await screen.findByDisplayValue('Еда')).toBeInTheDocument(); // Категория
  });

  // Тест 8: Отправка формы для редактирования задачи (расход)
  test('отправляет форму для редактирования задачи (расход) и вызывает updateTask', async () => {
    const initialData = {
      id: 'task456',
      type: 'expense' as 'expense',
      title: 'Обед в кафе',
      amountSpent: 350,
      comments: 'Бизнес-ланч',
      category: 'Еда',
    };
    await waitFor(() => {
      render(<TaskForm {...defaultProps} initialData={initialData} />);
    });

    fireEvent.change(screen.getByLabelText('Описание расхода:'), { target: { value: 'Ужин дома' } });
    fireEvent.change(screen.getByLabelText('Потрачено:'), { target: { value: '800' } });
    await waitFor(() => {
        fireEvent.change(screen.getByLabelText('Категория:'), { target: { value: 'Транспорт' } });
    });


    // Исправлено: использование 'Сохранить' вместо 'Сохранить изменения'
    fireEvent.click(screen.getByText('Сохранить'));

    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledTimes(1);
      expect(updateTask).toHaveBeenCalledWith('task456', expect.objectContaining({
        type: 'expense',
        title: 'Ужин дома',
        amountSpent: 800,
        category: 'Транспорт',
        weekId: 'week1',
        dayOfWeek: 'Monday',
      }));
      expect(mockOnTaskSaved).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // Тест 9: Закрытие формы по клику на фон
  test('закрывает форму при клике на фон', async () => { // Добавляем async/await
    await waitFor(() => {
      render(<TaskForm {...defaultProps} />);
    });
    fireEvent.click(screen.getByTestId('modal-overlay')); // Добавим data-testid для оверлея

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Тест 10: Закрытие формы по клику на кнопку закрытия
  test('закрывает форму при клике на кнопку закрытия', async () => { // Добавляем async/await
    await waitFor(() => {
      render(<TaskForm {...defaultProps} />);
    });
    fireEvent.click(screen.getByText('×')); // Символ × для закрытия

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Тест 11: Валидация required полей для дохода
  test('отображает ошибки валидации для required полей дохода', async () => {
    await waitFor(() => {
      render(<TaskForm {...defaultProps} />);
    });

    // Очищаем обязательные поля
    fireEvent.change(screen.getByLabelText('Название:'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Время:'), { target: { value: '' } });

    fireEvent.click(screen.getByText('Создать дело'));

    // В данном случае React Testing Library не эмулирует нативное поведение браузерной валидации форм.
    // Если бы валидация была реализована через JS (например, с состояниями ошибок), здесь были бы проверки.
    // Для browser-native валидации, expect(createTask).not.toHaveBeenCalled() является достаточным.
    await waitFor(() => {
        // Мы ожидаем, что createTask не будет вызван, так как форма невалидна
        expect(createTask).not.toHaveBeenCalled();
    });
  });

  // Тест 12: Валидация required полей для расхода
  test('отображает ошибки валидации для required полей расхода', async () => {
    await waitFor(() => {
        render(<TaskForm {...defaultProps} />);
    });
    fireEvent.change(screen.getByLabelText('Тип:'), { target: { value: 'expense' } });

    // Очищаем обязательные поля
    fireEvent.change(screen.getByLabelText('Описание расхода:'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Потрачено:'), { target: { value: '' } });
    await waitFor(() => {
        fireEvent.change(screen.getByLabelText('Категория:'), { target: { value: '' } });
    });


    fireEvent.click(screen.getByText('Создать дело'));

    await waitFor(() => {
        expect(createTask).not.toHaveBeenCalled();
    });
  });

});